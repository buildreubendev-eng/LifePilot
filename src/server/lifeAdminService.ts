import { calculateLifeAdminScore, createWeeklyBriefing, daysUntil, generateTasks, scoreLifeAdminItem } from "@/lib/prioritization";
import { getMockProviderSyncMessages } from "@/data/mockProviderSync";
import type {
  AuditEvent,
  ApprovalActionType,
  ApprovalRequest,
  ApprovalStatus,
  ActionRecommendation,
  BriefingSummary,
  DocumentRecord,
  IntegrationConnection,
  IntegrationProvider,
  IngestionRun,
  LifeAdminAction,
  LifeAdminCategory,
  LifeAdminMessage,
  LifeAdminStatus,
  LifeAdminTask,
  ManualTask,
  Priority,
  RawLifeAdminMessage,
  RecommendationAcceptResult,
  UserSettings,
} from "@/lib/types";
import { getLifeAdminRepository, type LifeAdminRepository, type MessageFilters } from "@/server/lifeAdminRepository";
import { parseRawLifeAdminMessage } from "@/server/rawMessageParser";
import { generateActionRecommendations, recommendationId } from "@/server/recommendationEngine";

export const lifeAdminStatuses: LifeAdminStatus[] = ["new", "reviewed", "completed", "ignored"];

export const lifeAdminActions: LifeAdminAction[] = [
  "mark_reviewed",
  "mark_complete",
  "ignore",
  "snooze",
  "save_document",
  "create_task",
];

export interface DashboardSummary {
  lifeAdminScore: number;
  priorityTasks: LifeAdminTask[];
  counts: {
    active: number;
    overdue: number;
    dueThisWeek: number;
    documentsToSave: number;
    messagesNeedingReply: number;
    subscriptionWarnings: number;
    manualTasks: number;
  };
}

export interface ItemActionInput {
  action: LifeAdminAction;
  snoozedUntil?: string;
  notes?: string;
  taskTitle?: string;
}

export interface ItemActionResult {
  item: LifeAdminMessage;
  document?: DocumentRecord;
  task?: ManualTask;
}

export interface CreateManualTaskInput {
  title: string;
  category: LifeAdminCategory;
  dueDate?: string;
  priority?: Priority;
  suggestedAction?: string;
  sourceMessageId?: string;
}

export interface CreateApprovalInput {
  actionType: ApprovalActionType;
  title: string;
  description: string;
  sourceMessageId?: string;
  riskLevel?: ApprovalRequest["riskLevel"];
}

export interface IngestRawMessagesInput {
  provider: RawLifeAdminMessage["provider"];
  messages: Array<Omit<RawLifeAdminMessage, "id" | "provider"> & { id?: string }>;
  notes?: string;
}

export interface SyncIntegrationResult {
  integration: IntegrationConnection;
  run: IngestionRun;
  items: LifeAdminMessage[];
  createdCount: number;
  duplicateCount: number;
}

export class LifeAdminService {
  constructor(private readonly repository: LifeAdminRepository = getLifeAdminRepository()) {}

  async listMessages(filters: MessageFilters = {}): Promise<LifeAdminMessage[]> {
    return this.repository.listMessages(filters);
  }

  async getMessage(id: string): Promise<LifeAdminMessage | null> {
    return this.repository.getMessage(id);
  }

  async updateStatus(id: string, status: LifeAdminStatus): Promise<LifeAdminMessage | null> {
    const item = await this.repository.updateStatus(id, status);

    if (item) {
      await this.audit("status_updated", "message", id, `Updated "${item.title}" to ${status}.`, { status });
    }

    return item;
  }

  async performItemAction(id: string, input: ItemActionInput): Promise<ItemActionResult | null> {
    const item = await this.repository.getMessage(id);

    if (!item) {
      return null;
    }

    if (input.action === "mark_reviewed") {
      const updated = await this.updateStatus(id, "reviewed");
      return updated ? { item: updated } : null;
    }

    if (input.action === "mark_complete") {
      const updated = await this.updateStatus(id, "completed");
      return updated ? { item: updated } : null;
    }

    if (input.action === "ignore") {
      const updated = await this.updateStatus(id, "ignored");
      return updated ? { item: updated } : null;
    }

    if (input.action === "snooze") {
      if (!input.snoozedUntil) {
        throw new Error("snoozedUntil is required for snooze actions");
      }

      const updated = await this.repository.updateMessage(id, {
        status: "reviewed",
        snoozedUntil: input.snoozedUntil,
      });

      if (!updated) {
        return null;
      }

      await this.audit("item_snoozed", "message", id, `Snoozed "${item.title}" until ${input.snoozedUntil}.`, {
        snoozedUntil: input.snoozedUntil,
      });
      return { item: updated };
    }

    if (input.action === "save_document") {
      const document = await this.saveDocumentFromMessage(item, input.notes);
      const updated = await this.repository.updateMessage(id, {
        status: item.status === "new" ? "reviewed" : item.status,
        documentSavedAt: document.savedAt,
      });

      if (!updated) {
        return null;
      }

      return { item: updated, document };
    }

    if (input.action === "create_task") {
      const task = await this.createManualTask({
        title: input.taskTitle ?? scoreLifeAdminItem(item).title,
        category: item.category,
        dueDate: item.dueDate,
        priority: item.priority,
        suggestedAction: item.suggestedAction,
        sourceMessageId: item.id,
      });
      const updated = await this.repository.updateMessage(id, {
        status: item.status === "new" ? "reviewed" : item.status,
        taskCreatedAt: task.createdAt,
      });

      if (!updated) {
        return null;
      }

      return { item: updated, task };
    }

    return null;
  }

  async listTasks(now = new Date()): Promise<LifeAdminTask[]> {
    const messages = await this.repository.listMessages();
    const manualTasks = await this.repository.listManualTasks();
    const generatedTasks = generateTasks(messages, now);
    return [...generatedTasks, ...manualTasks.map((task) => manualTaskToLifeAdminTask(task, now))].sort((a, b) => b.score - a.score);
  }

  async listManualTasks(): Promise<ManualTask[]> {
    return this.repository.listManualTasks();
  }

  async createManualTask(input: CreateManualTaskInput): Promise<ManualTask> {
    const existing = await this.findManualTaskForMessage(input.sourceMessageId);

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const task: ManualTask = {
      id: createId("task"),
      sourceMessageId: input.sourceMessageId,
      title: input.title,
      category: input.category,
      dueDate: input.dueDate,
      priority: input.priority ?? "medium",
      status: "new",
      suggestedAction: input.suggestedAction ?? input.title,
      createdAt: now,
      updatedAt: now,
    };
    const created = await this.repository.createManualTask(task);
    await this.audit("task_created", "task", created.id, `Created task "${created.title}".`, {
      sourceMessageId: created.sourceMessageId ?? null,
    });
    return created;
  }

  async updateManualTask(id: string, patch: Partial<ManualTask>): Promise<ManualTask | null> {
    const updated = await this.repository.updateManualTask(id, patch);

    if (updated) {
      await this.audit("task_updated", "task", id, `Updated task "${updated.title}".`, {
        status: updated.status,
      });
    }

    return updated;
  }

  async listDocuments(): Promise<DocumentRecord[]> {
    return this.repository.listDocuments();
  }

  async listApprovals(): Promise<ApprovalRequest[]> {
    return this.repository.listApprovals();
  }

  async listRecommendations(now = new Date()): Promise<ActionRecommendation[]> {
    const [messages, documents, tasks, approvals] = await Promise.all([
      this.repository.listMessages(),
      this.repository.listDocuments(),
      this.repository.listManualTasks(),
      this.repository.listApprovals(),
    ]);

    return generateActionRecommendations({ messages, documents, tasks, approvals, now });
  }

  async acceptRecommendation(id: string): Promise<RecommendationAcceptResult | null> {
    const recommendations = await this.listRecommendations();
    const recommendation = recommendations.find((candidate) => candidate.id === id);

    if (!recommendation) {
      return this.findAcceptedRecommendation(id);
    }

    const item = await this.repository.getMessage(recommendation.sourceMessageId);

    if (!item) {
      return null;
    }

    if (recommendation.actionType === "create_approval" && recommendation.approvalActionType) {
      const approval = await this.createApproval({
        actionType: recommendation.approvalActionType,
        title: recommendation.title,
        description: recommendation.description,
        sourceMessageId: recommendation.sourceMessageId,
        riskLevel: recommendation.riskLevel,
      });
      return { recommendation, item, approval };
    }

    if (recommendation.actionType === "save_document") {
      const result = await this.performItemAction(recommendation.sourceMessageId, { action: "save_document" });
      return result ? { recommendation, ...result } : null;
    }

    if (recommendation.actionType === "create_task") {
      const result = await this.performItemAction(recommendation.sourceMessageId, {
        action: "create_task",
        taskTitle: recommendation.title.replace(/^Create task for /, ""),
      });
      return result ? { recommendation, ...result } : null;
    }

    return null;
  }

  async ingestRawMessages(input: IngestRawMessagesInput): Promise<{ run: IngestionRun; items: LifeAdminMessage[] }> {
    const startedAt = new Date().toISOString();
    const items: LifeAdminMessage[] = [];
    const createdItemIds: string[] = [];
    const errorMessages: string[] = [];
    let duplicateCount = 0;
    const rawMessages = await this.repository.listRawMessages();
    const rawById = new Map(rawMessages.map((message) => [message.id, message]));
    const rawByDedupeKey = new Map(rawMessages.map((message) => [rawMessageDedupeKey(message), message]));

    for (const incoming of input.messages) {
      try {
        const raw: RawLifeAdminMessage = {
          ...incoming,
          id: incoming.id ?? createId("raw"),
          provider: input.provider,
        };
        const existingRaw = rawByDedupeKey.get(rawMessageDedupeKey(raw)) ?? rawById.get(raw.id);

        if (existingRaw) {
          duplicateCount += 1;
          const existingItem = await this.repository.getMessage(`msg-${existingRaw.id}`);

          if (existingItem) {
            items.push(existingItem);
            continue;
          }

          const recoveredItem = await this.repository.createMessage(parseRawLifeAdminMessage(existingRaw));
          items.push(recoveredItem);
          createdItemIds.push(recoveredItem.id);
          continue;
        }

        const parsed = parseRawLifeAdminMessage(raw);
        const existingItem = await this.repository.getMessage(parsed.id);

        await this.repository.createRawMessage(raw);
        rawById.set(raw.id, raw);
        rawByDedupeKey.set(rawMessageDedupeKey(raw), raw);

        if (existingItem) {
          duplicateCount += 1;
          items.push(existingItem);
          continue;
        }

        const item = await this.repository.createMessage(parsed);
        items.push(item);
        createdItemIds.push(item.id);
      } catch (error) {
        errorMessages.push(error instanceof Error ? error.message : "Unknown ingestion failure");
      }
    }

    const completedAt = new Date().toISOString();
    const failedCount = errorMessages.length;
    const status: IngestionRun["status"] = failedCount === input.messages.length ? "failed" : failedCount > 0 ? "partial" : "completed";
    const cursor = createIngestionCursor(input.provider, input.messages);
    const run = await this.repository.createIngestionRun({
      id: createId("ingest"),
      provider: input.provider,
      status,
      startedAt,
      completedAt,
      inputCount: input.messages.length,
      createdItemIds,
      duplicateCount,
      failedCount,
      errorMessages,
      cursor,
      notes: input.notes,
    });
    await this.audit("integration_updated", "integration", input.provider, `Ingested ${createdItemIds.length} new item(s) from ${input.provider}.`, {
      inputCount: input.messages.length,
      createdCount: createdItemIds.length,
      duplicateCount,
      failedCount,
    });
    return { run, items };
  }

  async listIngestionRuns(): Promise<IngestionRun[]> {
    return this.repository.listIngestionRuns();
  }

  async createApproval(input: CreateApprovalInput): Promise<ApprovalRequest> {
    const existing = await this.findPendingApproval(input);

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const approval: ApprovalRequest = {
      id: createId("approval"),
      actionType: input.actionType,
      sourceMessageId: input.sourceMessageId,
      title: input.title,
      description: input.description,
      riskLevel: input.riskLevel ?? defaultRiskLevel(input.actionType),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    const created = await this.repository.createApproval(approval);
    await this.audit("approval_created", "approval", created.id, `Created approval request "${created.title}".`, {
      actionType: created.actionType,
      sourceMessageId: created.sourceMessageId ?? null,
    });
    return created;
  }

  async reviewApproval(id: string, status: Exclude<ApprovalStatus, "pending">, reviewerNote?: string): Promise<ApprovalRequest | null> {
    const now = new Date().toISOString();
    const approval = await this.repository.updateApproval(id, {
      status,
      reviewerNote,
      reviewedAt: now,
      updatedAt: now,
    });

    if (approval) {
      await this.audit("approval_reviewed", "approval", id, `Marked approval request "${approval.title}" as ${status}.`, {
        status,
      });
    }

    return approval;
  }

  async getBriefing(now = new Date()): Promise<BriefingSummary> {
    const messages = await this.repository.listMessages();
    return createWeeklyBriefing(messages, now);
  }

  async getDashboardSummary(now = new Date()): Promise<DashboardSummary> {
    const messages = await this.repository.listMessages();
    const manualTasks = await this.repository.listManualTasks();
    const active = messages.filter((message) => message.status !== "completed" && message.status !== "ignored");
    const priorityTasks = await this.listTasks(now);

    return {
      lifeAdminScore: calculateLifeAdminScore(messages, now),
      priorityTasks: priorityTasks.slice(0, 8),
      counts: {
        active: active.length,
        overdue: active.filter((message) => {
          const distance = daysUntil(message.dueDate, now);
          return distance !== undefined && distance < 0;
        }).length,
        dueThisWeek: active.filter((message) => {
          const distance = daysUntil(message.dueDate, now);
          return distance !== undefined && distance >= 0 && distance <= 7;
        }).length,
        documentsToSave: active.filter((message) => message.documentSaveRecommended && !message.documentSavedAt).length,
        messagesNeedingReply: active.filter((message) => message.needsReply).length,
        subscriptionWarnings: active.filter((message) => message.category === "subscription").length,
        manualTasks: manualTasks.filter((task) => task.status !== "completed" && task.status !== "ignored").length,
      },
    };
  }

  async getSettings(): Promise<UserSettings> {
    return this.repository.getSettings();
  }

  async updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
    const settings = await this.repository.updateSettings(patch);
    await this.audit("settings_updated", "settings", "default", "Updated privacy and briefing settings.");
    return settings;
  }

  async listIntegrations(): Promise<IntegrationConnection[]> {
    return this.repository.listIntegrations();
  }

  async updateIntegration(provider: IntegrationProvider, patch: Partial<IntegrationConnection>): Promise<IntegrationConnection | null> {
    const integration = await this.repository.updateIntegration(provider, patch);

    if (integration) {
      await this.audit("integration_updated", "integration", provider, `Updated ${integration.label} integration status.`, {
        status: integration.status,
      });
    }

    return integration;
  }

  async syncIntegration(provider: IntegrationProvider): Promise<SyncIntegrationResult | null> {
    const current = (await this.repository.listIntegrations()).find((integration) => integration.provider === provider);

    if (!current) {
      return null;
    }

    const messages = getMockProviderSyncMessages(provider);
    const result = await this.ingestRawMessages({
      provider,
      messages,
      notes: `Mock ${current.label} sync. Future real connector will replace this payload after permissioned OAuth setup.`,
    });
    const now = new Date().toISOString();
    const integration = await this.updateIntegration(provider, {
      status: "connected",
      connectedAt: current.connectedAt ?? now,
      lastSyncAt: now,
      lastSyncCursor: result.run.cursor,
      notes: `Last mock sync created ${result.run.createdItemIds.length} new item(s) from ${messages.length} provider signal(s).`,
    });

    if (!integration) {
      return null;
    }

    return {
      integration,
      run: result.run,
      items: result.items,
      createdCount: result.run.createdItemIds.length,
      duplicateCount: result.run.duplicateCount,
    };
  }

  async listAuditEvents(limit?: number): Promise<AuditEvent[]> {
    return this.repository.listAuditEvents(limit);
  }

  async resetStatuses(): Promise<void> {
    await this.repository.resetStatuses();
    await this.audit("store_reset", "store", "statuses", "Reset message statuses, manual tasks, and document queue.");
  }

  async resetStore() {
    const store = await this.repository.resetStore();
    await this.audit("store_reset", "store", "all", "Reset the local PLOS data store.");
    return store;
  }

  private async saveDocumentFromMessage(item: LifeAdminMessage, notes?: string): Promise<DocumentRecord> {
    const existing = await this.findDocumentForMessage(item.id);

    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    const document: DocumentRecord = {
      id: `doc-${item.id}`,
      sourceMessageId: item.id,
      title: item.title,
      category: item.category,
      source: item.source,
      status: "saved",
      savedAt: now,
      notes,
    };
    const saved = await this.repository.upsertDocument(document);
    await this.audit("document_saved", "document", saved.id, `Saved document "${saved.title}".`, {
      sourceMessageId: item.id,
    });
    return saved;
  }

  private async findDocumentForMessage(sourceMessageId: string): Promise<DocumentRecord | undefined> {
    const documents = await this.repository.listDocuments();
    return documents.find((document) => document.sourceMessageId === sourceMessageId);
  }

  private async findManualTaskForMessage(sourceMessageId?: string): Promise<ManualTask | undefined> {
    if (!sourceMessageId) {
      return undefined;
    }

    const tasks = await this.repository.listManualTasks();
    return tasks.find((task) => task.sourceMessageId === sourceMessageId);
  }

  private async findPendingApproval(input: CreateApprovalInput): Promise<ApprovalRequest | undefined> {
    const approvals = await this.repository.listApprovals();
    return approvals.find(
      (approval) =>
        approval.status === "pending" &&
        approval.actionType === input.actionType &&
        (input.sourceMessageId
          ? approval.sourceMessageId === input.sourceMessageId
          : approval.title === input.title && approval.description === input.description),
    );
  }

  private async findAcceptedRecommendation(id: string): Promise<RecommendationAcceptResult | null> {
    const parsed = parseRecommendationId(id);

    if (!parsed) {
      return null;
    }

    const item = await this.repository.getMessage(parsed.sourceMessageId);

    if (!item) {
      return null;
    }

    if (parsed.actionType === "save_document") {
      const document = await this.findDocumentForMessage(parsed.sourceMessageId);
      return document ? { recommendation: recommendationFromDocument(item), item, document } : null;
    }

    if (parsed.actionType === "create_task") {
      const task = await this.findManualTaskForMessage(parsed.sourceMessageId);
      return task ? { recommendation: recommendationFromTask(item), item, task } : null;
    }

    const approvals = await this.repository.listApprovals();
    const approval = approvals.find(
      (candidate) => candidate.sourceMessageId === parsed.sourceMessageId && candidate.actionType === parsed.approvalActionType,
    );

    return approval ? { recommendation: recommendationFromApproval(item, approval), item, approval } : null;
  }

  private async audit(
    type: AuditEvent["type"],
    entityType: AuditEvent["entityType"],
    entityId: string,
    summary: string,
    metadata?: AuditEvent["metadata"],
  ): Promise<AuditEvent> {
    return this.repository.appendAuditEvent({
      id: createId("audit"),
      type,
      entityType,
      entityId,
      summary,
      createdAt: new Date().toISOString(),
      metadata,
    });
  }
}

export function getLifeAdminService(): LifeAdminService {
  return new LifeAdminService();
}

export function isLifeAdminStatus(value: unknown): value is LifeAdminStatus {
  return typeof value === "string" && lifeAdminStatuses.includes(value as LifeAdminStatus);
}

export function isLifeAdminAction(value: unknown): value is LifeAdminAction {
  return typeof value === "string" && lifeAdminActions.includes(value as LifeAdminAction);
}

function createId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function rawMessageDedupeKey(message: RawLifeAdminMessage): string {
  return message.externalId ? `${message.provider}:external:${message.externalId}` : `${message.provider}:raw:${message.id}`;
}

function createIngestionCursor(provider: RawLifeAdminMessage["provider"], messages: IngestRawMessagesInput["messages"]): string | undefined {
  const newest = messages
    .map((message) => message.receivedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return newest ? `${provider}:${newest}` : undefined;
}

function defaultRiskLevel(actionType: ApprovalActionType): ApprovalRequest["riskLevel"] {
  if (actionType === "make_payment" || actionType === "cancel_subscription") {
    return "high";
  }

  return "medium";
}

type ParsedRecommendationId =
  | { actionType: "save_document"; sourceMessageId: string }
  | { actionType: "create_task"; sourceMessageId: string }
  | { actionType: "create_approval"; approvalActionType: ApprovalActionType; sourceMessageId: string };

const approvalActionTypes: ApprovalActionType[] = ["send_message", "make_payment", "cancel_subscription"];

function parseRecommendationId(id: string): ParsedRecommendationId | null {
  const saveDocumentPrefix = "rec-save_document-";
  const createTaskPrefix = "rec-create_task-";

  if (id.startsWith(saveDocumentPrefix)) {
    return {
      actionType: "save_document",
      sourceMessageId: id.slice(saveDocumentPrefix.length),
    };
  }

  if (id.startsWith(createTaskPrefix)) {
    return {
      actionType: "create_task",
      sourceMessageId: id.slice(createTaskPrefix.length),
    };
  }

  for (const approvalActionType of approvalActionTypes) {
    const createApprovalPrefix = `rec-create_approval-${approvalActionType}-`;

    if (id.startsWith(createApprovalPrefix)) {
      return {
        actionType: "create_approval",
        approvalActionType,
        sourceMessageId: id.slice(createApprovalPrefix.length),
      };
    }
  }

  return null;
}

function recommendationFromDocument(item: LifeAdminMessage): ActionRecommendation {
  return {
    id: recommendationId("save_document", item.id),
    sourceMessageId: item.id,
    actionType: "save_document",
    title: `Save ${item.title}`,
    description: "Store this item in the PLOS document queue for records, tax, travel, warranty, or medical follow-up.",
    reason: "This document has already been saved; returning the existing record keeps repeated accepts idempotent.",
    priority: item.priority === "urgent" ? "high" : item.priority,
    riskLevel: "low",
    dueDate: item.dueDate,
    acceptLabel: "Saved",
  };
}

function recommendationFromTask(item: LifeAdminMessage): ActionRecommendation {
  return {
    id: recommendationId("create_task", item.id),
    sourceMessageId: item.id,
    actionType: "create_task",
    title: `Create task for ${item.title}`,
    description: item.suggestedAction,
    reason: "A task already exists for this item; returning it keeps repeated accepts idempotent.",
    priority: item.priority,
    riskLevel: "low",
    dueDate: item.dueDate,
    acceptLabel: "Created",
  };
}

function recommendationFromApproval(item: LifeAdminMessage, approval: ApprovalRequest): ActionRecommendation {
  return {
    id: recommendationId("create_approval", item.id, approval.actionType),
    sourceMessageId: item.id,
    actionType: "create_approval",
    approvalActionType: approval.actionType,
    title: approval.title,
    description: approval.description,
    reason: "An approval request already exists for this sensitive action; returning it keeps repeated accepts idempotent.",
    priority: item.priority,
    riskLevel: approval.riskLevel,
    dueDate: item.dueDate,
    acceptLabel: "Created",
  };
}

function manualTaskToLifeAdminTask(task: ManualTask, now: Date): LifeAdminTask {
  const score = scoreLifeAdminItem(
    {
      id: task.id,
      title: task.title,
      category: task.category,
      source: "Portal",
      sender: "PLOS",
      receivedAt: task.createdAt,
      dueDate: task.dueDate,
      priority: task.priority,
      suggestedAction: task.suggestedAction,
      confidence: 1,
      status: task.status,
      originalMessage: task.suggestedAction,
      flaggedReason: "User-created PLOS task.",
      extractedFields: [],
    },
    now,
  );

  return {
    ...score,
    id: task.id,
    messageId: task.sourceMessageId,
    title: task.title,
    status: task.status,
    suggestedAction: task.suggestedAction,
  };
}

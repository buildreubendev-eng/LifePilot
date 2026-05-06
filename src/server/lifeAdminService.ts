import { calculateLifeAdminScore, createWeeklyBriefing, daysUntil, generateTasks, scoreLifeAdminItem } from "@/lib/prioritization";
import type {
  AuditEvent,
  ApprovalActionType,
  ApprovalRequest,
  ApprovalStatus,
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
  UserSettings,
} from "@/lib/types";
import { getLifeAdminRepository, type LifeAdminRepository, type MessageFilters } from "@/server/lifeAdminRepository";
import { parseRawLifeAdminMessage } from "@/server/rawMessageParser";

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

  async ingestRawMessages(input: IngestRawMessagesInput): Promise<{ run: IngestionRun; items: LifeAdminMessage[] }> {
    const startedAt = new Date().toISOString();
    const createdItems: LifeAdminMessage[] = [];

    for (const incoming of input.messages) {
      const raw: RawLifeAdminMessage = {
        ...incoming,
        id: incoming.id ?? createId("raw"),
        provider: input.provider,
      };
      await this.repository.createRawMessage(raw);
      const item = await this.repository.createMessage(parseRawLifeAdminMessage(raw));
      createdItems.push(item);
    }

    const completedAt = new Date().toISOString();
    const run = await this.repository.createIngestionRun({
      id: createId("ingest"),
      provider: input.provider,
      status: "completed",
      startedAt,
      completedAt,
      inputCount: input.messages.length,
      createdItemIds: createdItems.map((item) => item.id),
      notes: input.notes,
    });
    await this.audit("integration_updated", "integration", input.provider, `Ingested ${createdItems.length} raw message(s) from ${input.provider}.`, {
      inputCount: input.messages.length,
    });
    return { run, items: createdItems };
  }

  async listIngestionRuns(): Promise<IngestionRun[]> {
    return this.repository.listIngestionRuns();
  }

  async createApproval(input: CreateApprovalInput): Promise<ApprovalRequest> {
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

function defaultRiskLevel(actionType: ApprovalActionType): ApprovalRequest["riskLevel"] {
  if (actionType === "make_payment" || actionType === "cancel_subscription") {
    return "high";
  }

  return "medium";
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

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { cwd, env } from "node:process";
import { tmpdir } from "node:os";
import { PrismaClient } from "@prisma/client";
import { mockMessages } from "@/data/mockMessages";
import type {
  AuditEvent,
  ApprovalRequest,
  DocumentRecord,
  IntegrationConnection,
  IntegrationProvider,
  LifeAdminMessage,
  LifeAdminStatus,
  ManualTask,
  IngestionRun,
  RawLifeAdminMessage,
  UserSettings,
} from "@/lib/types";

export interface PlosDataStore {
  version: 1;
  messages: LifeAdminMessage[];
  manualTasks: ManualTask[];
  documents: DocumentRecord[];
  settings: UserSettings;
  integrations: IntegrationConnection[];
  auditLog: AuditEvent[];
  approvals: ApprovalRequest[];
  rawMessages: RawLifeAdminMessage[];
  ingestionRuns: IngestionRun[];
}

export interface MessageFilters {
  category?: string;
  status?: string;
  query?: string;
  includeDisabledCategories?: boolean;
}

export interface LifeAdminRepository {
  listMessages(filters?: MessageFilters): Promise<LifeAdminMessage[]>;
  getMessage(id: string): Promise<LifeAdminMessage | null>;
  updateMessage(id: string, patch: Partial<LifeAdminMessage>): Promise<LifeAdminMessage | null>;
  updateStatus(id: string, status: LifeAdminStatus): Promise<LifeAdminMessage | null>;
  listManualTasks(): Promise<ManualTask[]>;
  getManualTask(id: string): Promise<ManualTask | null>;
  createManualTask(task: ManualTask): Promise<ManualTask>;
  updateManualTask(id: string, patch: Partial<ManualTask>): Promise<ManualTask | null>;
  listDocuments(): Promise<DocumentRecord[]>;
  upsertDocument(document: DocumentRecord): Promise<DocumentRecord>;
  getSettings(): Promise<UserSettings>;
  updateSettings(patch: Partial<UserSettings>): Promise<UserSettings>;
  listIntegrations(): Promise<IntegrationConnection[]>;
  updateIntegration(provider: IntegrationProvider, patch: Partial<IntegrationConnection>): Promise<IntegrationConnection | null>;
  listAuditEvents(limit?: number): Promise<AuditEvent[]>;
  appendAuditEvent(event: AuditEvent): Promise<AuditEvent>;
  listApprovals(): Promise<ApprovalRequest[]>;
  createApproval(approval: ApprovalRequest): Promise<ApprovalRequest>;
  updateApproval(id: string, patch: Partial<ApprovalRequest>): Promise<ApprovalRequest | null>;
  createMessage(message: LifeAdminMessage): Promise<LifeAdminMessage>;
  listRawMessages(): Promise<RawLifeAdminMessage[]>;
  createRawMessage(message: RawLifeAdminMessage): Promise<RawLifeAdminMessage>;
  listIngestionRuns(): Promise<IngestionRun[]>;
  createIngestionRun(run: IngestionRun): Promise<IngestionRun>;
  resetStore(): Promise<PlosDataStore>;
  resetStatuses(): Promise<void>;
}

export class MockLifeAdminRepository implements LifeAdminRepository {
  private store: PlosDataStore;

  constructor(seedMessages: LifeAdminMessage[] = mockMessages, initialStore?: Partial<PlosDataStore>) {
    this.store = {
      ...createSeedStore(seedMessages),
      ...initialStore,
      messages: cloneMessages(initialStore?.messages ?? seedMessages),
      manualTasks: cloneManualTasks(initialStore?.manualTasks ?? []),
      documents: cloneDocuments(initialStore?.documents ?? []),
      settings: cloneSettings(initialStore?.settings ?? createDefaultSettings()),
      integrations: cloneIntegrations(initialStore?.integrations ?? createDefaultIntegrations()),
      auditLog: cloneAuditEvents(initialStore?.auditLog ?? []),
      approvals: cloneApprovals(initialStore?.approvals ?? []),
      rawMessages: cloneRawMessages(initialStore?.rawMessages ?? []),
      ingestionRuns: cloneIngestionRuns(initialStore?.ingestionRuns ?? []),
    };
  }

  async listMessages(filters: MessageFilters = {}): Promise<LifeAdminMessage[]> {
    return applyMessageFilters(cloneMessages(this.store.messages), this.store.settings, filters);
  }

  async getMessage(id: string): Promise<LifeAdminMessage | null> {
    return cloneMessage(this.store.messages.find((message) => message.id === id) ?? null);
  }

  async updateMessage(id: string, patch: Partial<LifeAdminMessage>): Promise<LifeAdminMessage | null> {
    const index = this.store.messages.findIndex((message) => message.id === id);

    if (index === -1) {
      return null;
    }

    const updated = { ...this.store.messages[index], ...patch, id, updatedAt: patch.updatedAt ?? new Date().toISOString() };
    this.store.messages[index] = updated;
    return cloneMessage(updated);
  }

  async updateStatus(id: string, status: LifeAdminStatus): Promise<LifeAdminMessage | null> {
    return this.updateMessage(id, { status });
  }

  async createMessage(message: LifeAdminMessage): Promise<LifeAdminMessage> {
    this.store.messages.push(cloneMessage(message) as LifeAdminMessage);
    return cloneMessage(message) as LifeAdminMessage;
  }

  async listManualTasks(): Promise<ManualTask[]> {
    return cloneManualTasks(this.store.manualTasks);
  }

  async getManualTask(id: string): Promise<ManualTask | null> {
    return cloneManualTask(this.store.manualTasks.find((task) => task.id === id) ?? null);
  }

  async createManualTask(task: ManualTask): Promise<ManualTask> {
    this.store.manualTasks.push({ ...task });
    return cloneManualTask(task) as ManualTask;
  }

  async updateManualTask(id: string, patch: Partial<ManualTask>): Promise<ManualTask | null> {
    const index = this.store.manualTasks.findIndex((task) => task.id === id);

    if (index === -1) {
      return null;
    }

    const updated = { ...this.store.manualTasks[index], ...patch, id, updatedAt: patch.updatedAt ?? new Date().toISOString() };
    this.store.manualTasks[index] = updated;
    return cloneManualTask(updated);
  }

  async listDocuments(): Promise<DocumentRecord[]> {
    return cloneDocuments(this.store.documents);
  }

  async upsertDocument(document: DocumentRecord): Promise<DocumentRecord> {
    const index = this.store.documents.findIndex((current) => current.id === document.id);

    if (index === -1) {
      this.store.documents.push({ ...document });
    } else {
      this.store.documents[index] = { ...document };
    }

    return cloneDocument(document) as DocumentRecord;
  }

  async getSettings(): Promise<UserSettings> {
    return cloneSettings(this.store.settings);
  }

  async updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
    this.store.settings = mergeSettings(this.store.settings, patch);
    return cloneSettings(this.store.settings);
  }

  async listIntegrations(): Promise<IntegrationConnection[]> {
    return cloneIntegrations(this.store.integrations);
  }

  async updateIntegration(provider: IntegrationProvider, patch: Partial<IntegrationConnection>): Promise<IntegrationConnection | null> {
    const index = this.store.integrations.findIndex((integration) => integration.provider === provider);

    if (index === -1) {
      return null;
    }

    this.store.integrations[index] = { ...this.store.integrations[index], ...patch, provider };
    return cloneIntegration(this.store.integrations[index]);
  }

  async listAuditEvents(limit = 100): Promise<AuditEvent[]> {
    return cloneAuditEvents(this.store.auditLog).slice(-limit).reverse();
  }

  async appendAuditEvent(event: AuditEvent): Promise<AuditEvent> {
    this.store.auditLog.push({ ...event });
    return cloneAuditEvent(event) as AuditEvent;
  }

  async listApprovals(): Promise<ApprovalRequest[]> {
    return cloneApprovals(this.store.approvals);
  }

  async createApproval(approval: ApprovalRequest): Promise<ApprovalRequest> {
    this.store.approvals.push({ ...approval });
    return cloneApproval(approval) as ApprovalRequest;
  }

  async updateApproval(id: string, patch: Partial<ApprovalRequest>): Promise<ApprovalRequest | null> {
    const index = this.store.approvals.findIndex((approval) => approval.id === id);

    if (index === -1) {
      return null;
    }

    const updated = { ...this.store.approvals[index], ...patch, id, updatedAt: patch.updatedAt ?? new Date().toISOString() };
    this.store.approvals[index] = updated;
    return cloneApproval(updated);
  }

  async listRawMessages(): Promise<RawLifeAdminMessage[]> {
    return cloneRawMessages(this.store.rawMessages);
  }

  async createRawMessage(message: RawLifeAdminMessage): Promise<RawLifeAdminMessage> {
    this.store.rawMessages.push({ ...message });
    return cloneRawMessage(message) as RawLifeAdminMessage;
  }

  async listIngestionRuns(): Promise<IngestionRun[]> {
    return cloneIngestionRuns(this.store.ingestionRuns).reverse();
  }

  async createIngestionRun(run: IngestionRun): Promise<IngestionRun> {
    this.store.ingestionRuns.push({ ...run, createdItemIds: [...run.createdItemIds] });
    return cloneIngestionRun(run) as IngestionRun;
  }

  async resetStore(): Promise<PlosDataStore> {
    this.store = createSeedStore();
    return cloneStore(this.store);
  }

  async resetStatuses(): Promise<void> {
    this.store.messages = cloneMessages(mockMessages);
    this.store.manualTasks = [];
    this.store.documents = [];
    this.store.approvals = [];
    this.store.rawMessages = [];
    this.store.ingestionRuns = [];
  }
}

export class JsonFileLifeAdminRepository implements LifeAdminRepository {
  constructor(private readonly filePath = getJsonStorePath()) {}

  async listMessages(filters: MessageFilters = {}): Promise<LifeAdminMessage[]> {
    const store = await this.readStore();
    return applyMessageFilters(cloneMessages(store.messages), store.settings, filters);
  }

  async getMessage(id: string): Promise<LifeAdminMessage | null> {
    const store = await this.readStore();
    return cloneMessage(store.messages.find((message) => message.id === id) ?? null);
  }

  async updateMessage(id: string, patch: Partial<LifeAdminMessage>): Promise<LifeAdminMessage | null> {
    const store = await this.readStore();
    const index = store.messages.findIndex((message) => message.id === id);

    if (index === -1) {
      return null;
    }

    const updated = { ...store.messages[index], ...patch, id, updatedAt: patch.updatedAt ?? new Date().toISOString() };
    store.messages[index] = updated;
    await this.writeStore(store);
    return cloneMessage(updated);
  }

  async updateStatus(id: string, status: LifeAdminStatus): Promise<LifeAdminMessage | null> {
    return this.updateMessage(id, { status });
  }

  async createMessage(message: LifeAdminMessage): Promise<LifeAdminMessage> {
    const store = await this.readStore();
    store.messages.push(cloneMessage(message) as LifeAdminMessage);
    await this.writeStore(store);
    return cloneMessage(message) as LifeAdminMessage;
  }

  async listManualTasks(): Promise<ManualTask[]> {
    const store = await this.readStore();
    return cloneManualTasks(store.manualTasks);
  }

  async getManualTask(id: string): Promise<ManualTask | null> {
    const store = await this.readStore();
    return cloneManualTask(store.manualTasks.find((task) => task.id === id) ?? null);
  }

  async createManualTask(task: ManualTask): Promise<ManualTask> {
    const store = await this.readStore();
    store.manualTasks.push({ ...task });
    await this.writeStore(store);
    return cloneManualTask(task) as ManualTask;
  }

  async updateManualTask(id: string, patch: Partial<ManualTask>): Promise<ManualTask | null> {
    const store = await this.readStore();
    const index = store.manualTasks.findIndex((task) => task.id === id);

    if (index === -1) {
      return null;
    }

    const updated = { ...store.manualTasks[index], ...patch, id, updatedAt: patch.updatedAt ?? new Date().toISOString() };
    store.manualTasks[index] = updated;
    await this.writeStore(store);
    return cloneManualTask(updated);
  }

  async listDocuments(): Promise<DocumentRecord[]> {
    const store = await this.readStore();
    return cloneDocuments(store.documents);
  }

  async upsertDocument(document: DocumentRecord): Promise<DocumentRecord> {
    const store = await this.readStore();
    const index = store.documents.findIndex((current) => current.id === document.id);

    if (index === -1) {
      store.documents.push({ ...document });
    } else {
      store.documents[index] = { ...document };
    }

    await this.writeStore(store);
    return cloneDocument(document) as DocumentRecord;
  }

  async getSettings(): Promise<UserSettings> {
    const store = await this.readStore();
    return cloneSettings(store.settings);
  }

  async updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
    const store = await this.readStore();
    store.settings = mergeSettings(store.settings, patch);
    await this.writeStore(store);
    return cloneSettings(store.settings);
  }

  async listIntegrations(): Promise<IntegrationConnection[]> {
    const store = await this.readStore();
    return cloneIntegrations(store.integrations);
  }

  async updateIntegration(provider: IntegrationProvider, patch: Partial<IntegrationConnection>): Promise<IntegrationConnection | null> {
    const store = await this.readStore();
    const index = store.integrations.findIndex((integration) => integration.provider === provider);

    if (index === -1) {
      return null;
    }

    store.integrations[index] = { ...store.integrations[index], ...patch, provider };
    await this.writeStore(store);
    return cloneIntegration(store.integrations[index]);
  }

  async listAuditEvents(limit = 100): Promise<AuditEvent[]> {
    const store = await this.readStore();
    return cloneAuditEvents(store.auditLog).slice(-limit).reverse();
  }

  async appendAuditEvent(event: AuditEvent): Promise<AuditEvent> {
    const store = await this.readStore();
    store.auditLog.push({ ...event });
    await this.writeStore(store);
    return cloneAuditEvent(event) as AuditEvent;
  }

  async listApprovals(): Promise<ApprovalRequest[]> {
    const store = await this.readStore();
    return cloneApprovals(store.approvals);
  }

  async createApproval(approval: ApprovalRequest): Promise<ApprovalRequest> {
    const store = await this.readStore();
    store.approvals.push({ ...approval });
    await this.writeStore(store);
    return cloneApproval(approval) as ApprovalRequest;
  }

  async updateApproval(id: string, patch: Partial<ApprovalRequest>): Promise<ApprovalRequest | null> {
    const store = await this.readStore();
    const index = store.approvals.findIndex((approval) => approval.id === id);

    if (index === -1) {
      return null;
    }

    const updated = { ...store.approvals[index], ...patch, id, updatedAt: patch.updatedAt ?? new Date().toISOString() };
    store.approvals[index] = updated;
    await this.writeStore(store);
    return cloneApproval(updated);
  }

  async listRawMessages(): Promise<RawLifeAdminMessage[]> {
    const store = await this.readStore();
    return cloneRawMessages(store.rawMessages);
  }

  async createRawMessage(message: RawLifeAdminMessage): Promise<RawLifeAdminMessage> {
    const store = await this.readStore();
    store.rawMessages.push({ ...message });
    await this.writeStore(store);
    return cloneRawMessage(message) as RawLifeAdminMessage;
  }

  async listIngestionRuns(): Promise<IngestionRun[]> {
    const store = await this.readStore();
    return cloneIngestionRuns(store.ingestionRuns).reverse();
  }

  async createIngestionRun(run: IngestionRun): Promise<IngestionRun> {
    const store = await this.readStore();
    store.ingestionRuns.push({ ...run, createdItemIds: [...run.createdItemIds] });
    await this.writeStore(store);
    return cloneIngestionRun(run) as IngestionRun;
  }

  async resetStore(): Promise<PlosDataStore> {
    const store = createSeedStore();
    await this.writeStore(store);
    return cloneStore(store);
  }

  async resetStatuses(): Promise<void> {
    const store = await this.readStore();
    store.messages = cloneMessages(mockMessages);
    store.manualTasks = [];
    store.documents = [];
    store.approvals = [];
    store.rawMessages = [];
    store.ingestionRuns = [];
    await this.writeStore(store);
  }

  private async readStore(): Promise<PlosDataStore> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      return normalizeStore(JSON.parse(raw) as Partial<PlosDataStore>);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        const store = createSeedStore();
        await this.writeStore(store);
        return store;
      }

      throw error;
    }
  }

  private async writeStore(store: PlosDataStore): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    const tempPath = `${this.filePath}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(normalizeStore(store), null, 2)}\n`, "utf8");
    await rename(tempPath, this.filePath);
  }
}

export function getJsonStorePath(): string {
  if (env.PLOS_DATA_FILE) {
    return env.PLOS_DATA_FILE;
  }

  if (env.VERCEL) {
    return join(tmpdir(), "plos-store.json");
  }

  return join(cwd(), ".data", "plos-store.json");
}

const globalForPrisma = globalThis as unknown as { plosPrisma?: PrismaClient };

function getPrismaClient(): PrismaClient {
  globalForPrisma.plosPrisma ??= new PrismaClient();
  return globalForPrisma.plosPrisma;
}

export class PrismaLifeAdminRepository implements LifeAdminRepository {
  constructor(private readonly prisma = getPrismaClient()) {}

  async listMessages(filters: MessageFilters = {}): Promise<LifeAdminMessage[]> {
    await this.ensureSeeded();
    const [messages, settings] = await Promise.all([
      this.prisma.lifeAdminMessage.findMany({ orderBy: [{ dueDate: "asc" }, { receivedAt: "desc" }] }),
      this.getSettings(),
    ]);
    return applyMessageFilters(messages.map(prismaMessageToLifeAdminMessage), settings, filters);
  }

  async getMessage(id: string): Promise<LifeAdminMessage | null> {
    await this.ensureSeeded();
    const message = await this.prisma.lifeAdminMessage.findUnique({ where: { id } });
    return message ? prismaMessageToLifeAdminMessage(message) : null;
  }

  async updateMessage(id: string, patch: Partial<LifeAdminMessage>): Promise<LifeAdminMessage | null> {
    await this.ensureSeeded();

    try {
      const updated = await this.prisma.lifeAdminMessage.update({
        where: { id },
        data: lifeAdminMessagePatchToPrisma(patch),
      });
      return prismaMessageToLifeAdminMessage(updated);
    } catch (error) {
      if (isPrismaNotFound(error)) return null;
      throw error;
    }
  }

  async updateStatus(id: string, status: LifeAdminStatus): Promise<LifeAdminMessage | null> {
    return this.updateMessage(id, { status });
  }

  async createMessage(message: LifeAdminMessage): Promise<LifeAdminMessage> {
    const created = await this.prisma.lifeAdminMessage.create({
      data: lifeAdminMessageToPrismaCreate(message),
    });
    return prismaMessageToLifeAdminMessage(created);
  }

  async listManualTasks(): Promise<ManualTask[]> {
    await this.ensureSeeded();
    const tasks = await this.prisma.manualTask.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] });
    return tasks.map(prismaManualTaskToManualTask);
  }

  async getManualTask(id: string): Promise<ManualTask | null> {
    await this.ensureSeeded();
    const task = await this.prisma.manualTask.findUnique({ where: { id } });
    return task ? prismaManualTaskToManualTask(task) : null;
  }

  async createManualTask(task: ManualTask): Promise<ManualTask> {
    const created = await this.prisma.manualTask.create({
      data: manualTaskToPrismaCreate(task),
    });
    return prismaManualTaskToManualTask(created);
  }

  async updateManualTask(id: string, patch: Partial<ManualTask>): Promise<ManualTask | null> {
    try {
      const updated = await this.prisma.manualTask.update({
        where: { id },
        data: manualTaskPatchToPrisma(patch),
      });
      return prismaManualTaskToManualTask(updated);
    } catch (error) {
      if (isPrismaNotFound(error)) return null;
      throw error;
    }
  }

  async listDocuments(): Promise<DocumentRecord[]> {
    await this.ensureSeeded();
    const documents = await this.prisma.documentRecord.findMany({ orderBy: { savedAt: "desc" } });
    return documents.map(prismaDocumentToDocumentRecord);
  }

  async upsertDocument(document: DocumentRecord): Promise<DocumentRecord> {
    const saved = await this.prisma.documentRecord.upsert({
      where: { id: document.id },
      create: documentToPrismaCreate(document),
      update: documentToPrismaUpdate(document),
    });
    return prismaDocumentToDocumentRecord(saved);
  }

  async getSettings(): Promise<UserSettings> {
    await this.ensureSettings();
    const settings = await this.prisma.userSettings.findUniqueOrThrow({ where: { id: "default" } });
    return prismaSettingsToUserSettings(settings);
  }

  async updateSettings(patch: Partial<UserSettings>): Promise<UserSettings> {
    await this.ensureSettings();
    const current = await this.getSettings();
    const merged = mergeSettings(current, patch);
    const updated = await this.prisma.userSettings.update({
      where: { id: "default" },
      data: userSettingsToPrismaUpdate(merged),
    });
    return prismaSettingsToUserSettings(updated);
  }

  async listIntegrations(): Promise<IntegrationConnection[]> {
    await this.ensureIntegrations();
    const integrations = await this.prisma.integrationConnection.findMany({ orderBy: { provider: "asc" } });
    return normalizeIntegrations(integrations.map(prismaIntegrationToIntegrationConnection));
  }

  async updateIntegration(provider: IntegrationProvider, patch: Partial<IntegrationConnection>): Promise<IntegrationConnection | null> {
    await this.ensureIntegrations();

    try {
      const updated = await this.prisma.integrationConnection.update({
        where: { provider },
        data: integrationPatchToPrisma(patch),
      });
      return prismaIntegrationToIntegrationConnection(updated);
    } catch (error) {
      if (isPrismaNotFound(error)) return null;
      throw error;
    }
  }

  async listAuditEvents(limit = 100): Promise<AuditEvent[]> {
    await this.ensureSeeded();
    const events = await this.prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return events.map(prismaAuditEventToAuditEvent);
  }

  async appendAuditEvent(event: AuditEvent): Promise<AuditEvent> {
    const created = await this.prisma.auditEvent.create({
      data: auditEventToPrismaCreate(event),
    });
    return prismaAuditEventToAuditEvent(created);
  }

  async listApprovals(): Promise<ApprovalRequest[]> {
    await this.ensureSeeded();
    const approvals = await this.prisma.approvalRequest.findMany({ orderBy: { createdAt: "desc" } });
    return approvals.map(prismaApprovalToApprovalRequest);
  }

  async createApproval(approval: ApprovalRequest): Promise<ApprovalRequest> {
    const created = await this.prisma.approvalRequest.create({
      data: approvalToPrismaCreate(approval),
    });
    return prismaApprovalToApprovalRequest(created);
  }

  async updateApproval(id: string, patch: Partial<ApprovalRequest>): Promise<ApprovalRequest | null> {
    try {
      const updated = await this.prisma.approvalRequest.update({
        where: { id },
        data: approvalPatchToPrisma(patch),
      });
      return prismaApprovalToApprovalRequest(updated);
    } catch (error) {
      if (isPrismaNotFound(error)) return null;
      throw error;
    }
  }

  async listRawMessages(): Promise<RawLifeAdminMessage[]> {
    await this.ensureSeeded();
    const messages = await this.prisma.rawLifeAdminMessage.findMany({ orderBy: { receivedAt: "desc" } });
    return messages.map(prismaRawMessageToRawLifeAdminMessage);
  }

  async createRawMessage(message: RawLifeAdminMessage): Promise<RawLifeAdminMessage> {
    const created = await this.prisma.rawLifeAdminMessage.create({
      data: rawMessageToPrismaCreate(message),
    });
    return prismaRawMessageToRawLifeAdminMessage(created);
  }

  async listIngestionRuns(): Promise<IngestionRun[]> {
    await this.ensureSeeded();
    const runs = await this.prisma.ingestionRun.findMany({ orderBy: { startedAt: "desc" } });
    return runs.map(prismaIngestionRunToIngestionRun);
  }

  async createIngestionRun(run: IngestionRun): Promise<IngestionRun> {
    const created = await this.prisma.ingestionRun.create({
      data: ingestionRunToPrismaCreate(run),
    });
    return prismaIngestionRunToIngestionRun(created);
  }

  async resetStore(): Promise<PlosDataStore> {
    await this.prisma.$transaction([
      this.prisma.documentRecord.deleteMany(),
      this.prisma.manualTask.deleteMany(),
      this.prisma.approvalRequest.deleteMany(),
      this.prisma.auditEvent.deleteMany(),
      this.prisma.rawLifeAdminMessage.deleteMany(),
      this.prisma.ingestionRun.deleteMany(),
      this.prisma.integrationConnection.deleteMany(),
      this.prisma.userSettings.deleteMany(),
      this.prisma.lifeAdminMessage.deleteMany(),
    ]);
    await this.seed();
    return this.readStore();
  }

  async resetStatuses(): Promise<void> {
    await this.ensureSeeded();
    const seedIds = mockMessages.map((message) => message.id);
    await this.prisma.$transaction([
      this.prisma.lifeAdminMessage.deleteMany({
        where: {
          id: {
            notIn: seedIds,
          },
        },
      }),
      ...mockMessages.map((message) => this.prisma.lifeAdminMessage.update({
        where: { id: message.id },
        data: {
          status: message.status,
          snoozedUntil: null,
          documentSavedAt: null,
          taskCreatedAt: null,
        },
      })),
      this.prisma.documentRecord.deleteMany(),
      this.prisma.manualTask.deleteMany(),
      this.prisma.approvalRequest.deleteMany(),
      this.prisma.rawLifeAdminMessage.deleteMany(),
      this.prisma.ingestionRun.deleteMany(),
    ]);
  }

  private async ensureSeeded(): Promise<void> {
    const count = await this.prisma.lifeAdminMessage.count();
    if (count === 0) {
      await this.seed();
      return;
    }

    await Promise.all([this.ensureSettings(), this.ensureIntegrations()]);
  }

  private async ensureSettings(): Promise<void> {
    await this.prisma.userSettings.upsert({
      where: { id: "default" },
      create: userSettingsToPrismaCreate(createDefaultSettings()),
      update: {},
    });
  }

  private async ensureIntegrations(): Promise<void> {
    await Promise.all(
      createDefaultIntegrations().map((integration) => this.prisma.integrationConnection.upsert({
        where: { provider: integration.provider },
        create: integrationToPrismaCreate(integration),
        update: {},
      })),
    );
  }

  private async seed(): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userSettings.upsert({
        where: { id: "default" },
        create: userSettingsToPrismaCreate(createDefaultSettings()),
        update: {},
      }),
      ...createDefaultIntegrations().map((integration) => this.prisma.integrationConnection.upsert({
        where: { provider: integration.provider },
        create: integrationToPrismaCreate(integration),
        update: {},
      })),
      ...mockMessages.map((message) => this.prisma.lifeAdminMessage.upsert({
        where: { id: message.id },
        create: lifeAdminMessageToPrismaCreate(message),
        update: {},
      })),
    ]);
  }

  private async readStore(): Promise<PlosDataStore> {
    const [messages, manualTasks, documents, settings, integrations, auditLog, approvals, rawMessages, ingestionRuns] = await Promise.all([
      this.prisma.lifeAdminMessage.findMany({ orderBy: [{ dueDate: "asc" }, { receivedAt: "desc" }] }),
      this.prisma.manualTask.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }] }),
      this.prisma.documentRecord.findMany({ orderBy: { savedAt: "desc" } }),
      this.prisma.userSettings.findUniqueOrThrow({ where: { id: "default" } }),
      this.prisma.integrationConnection.findMany({ orderBy: { provider: "asc" } }),
      this.prisma.auditEvent.findMany({ orderBy: { createdAt: "asc" } }),
      this.prisma.approvalRequest.findMany({ orderBy: { createdAt: "asc" } }),
      this.prisma.rawLifeAdminMessage.findMany({ orderBy: { receivedAt: "desc" } }),
      this.prisma.ingestionRun.findMany({ orderBy: { startedAt: "desc" } }),
    ]);

    return {
      version: 1,
      messages: messages.map(prismaMessageToLifeAdminMessage),
      manualTasks: manualTasks.map(prismaManualTaskToManualTask),
      documents: documents.map(prismaDocumentToDocumentRecord),
      settings: prismaSettingsToUserSettings(settings),
      integrations: normalizeIntegrations(integrations.map(prismaIntegrationToIntegrationConnection)),
      auditLog: auditLog.map(prismaAuditEventToAuditEvent),
      approvals: approvals.map(prismaApprovalToApprovalRequest),
      rawMessages: rawMessages.map(prismaRawMessageToRawLifeAdminMessage),
      ingestionRuns: ingestionRuns.map(prismaIngestionRunToIngestionRun),
    };
  }
}

function createConfiguredRepository(): LifeAdminRepository {
  return process.env.PLOS_REPOSITORY === "prisma"
    ? new PrismaLifeAdminRepository()
    : new JsonFileLifeAdminRepository();
}

let repository: LifeAdminRepository = createConfiguredRepository();

export function getLifeAdminRepository(): LifeAdminRepository {
  return repository;
}

export function setLifeAdminRepository(nextRepository: LifeAdminRepository): void {
  repository = nextRepository;
}

export function createDefaultSettings(): UserSettings {
  return {
    disabledCategories: [],
    approvalRequiredFor: {
      sendingMessages: true,
      payments: true,
      cancellations: true,
    },
    weeklyBriefingDay: "Monday",
    timezone: "America/Chicago",
  };
}

export function createDefaultIntegrations(): IntegrationConnection[] {
  return [
    {
      provider: "gmail",
      label: "Gmail",
      status: "not_connected",
      permissionScopes: ["read selected emails", "never send without approval"],
      notes: "Future connector for permissioned email parsing.",
    },
    {
      provider: "google-calendar",
      label: "Google Calendar",
      status: "not_connected",
      permissionScopes: ["read selected calendars", "never edit without approval"],
      notes: "Future connector for appointments, conflicts, and reminders.",
    },
    {
      provider: "plaid",
      label: "Plaid",
      status: "not_connected",
      permissionScopes: ["read permitted account metadata", "no payments in MVP"],
      notes: "Future connector for bills, recurring charges, and subscription signals.",
    },
    {
      provider: "health",
      label: "Health portals",
      status: "not_connected",
      permissionScopes: ["read permitted portal notifications"],
      notes: "Future connector for appointments, prescriptions, and medical bills.",
    },
  ];
}

export function createSeedStore(seedMessages: LifeAdminMessage[] = mockMessages): PlosDataStore {
  return {
    version: 1,
    messages: cloneMessages(seedMessages),
    manualTasks: [],
    documents: [],
    settings: createDefaultSettings(),
    integrations: createDefaultIntegrations(),
    auditLog: [],
    approvals: [],
    rawMessages: [],
    ingestionRuns: [],
  };
}

function normalizeStore(store: Partial<PlosDataStore>): PlosDataStore {
  const seed = createSeedStore();
  return {
    version: 1,
    messages: cloneMessages(store.messages ?? seed.messages),
    manualTasks: cloneManualTasks(store.manualTasks ?? []),
    documents: cloneDocuments(store.documents ?? []),
    settings: mergeSettings(seed.settings, store.settings ?? {}),
    integrations: normalizeIntegrations(store.integrations ?? seed.integrations),
    auditLog: cloneAuditEvents(store.auditLog ?? []),
    approvals: cloneApprovals(store.approvals ?? []),
    rawMessages: cloneRawMessages(store.rawMessages ?? []),
    ingestionRuns: cloneIngestionRuns(store.ingestionRuns ?? []),
  };
}

export function applyMessageFilters(messages: LifeAdminMessage[], settings: UserSettings, filters: MessageFilters): LifeAdminMessage[] {
  return messages.filter((message) => {
    const disabled = !filters.includeDisabledCategories && settings.disabledCategories.includes(message.category);
    const categoryMatch = !filters.category || message.category === filters.category;
    const statusMatch = !filters.status || message.status === filters.status;
    const query = filters.query?.trim().toLowerCase();
    const queryMatch =
      !query ||
      [message.title, message.sender, message.source, message.suggestedAction, message.originalMessage]
        .join(" ")
        .toLowerCase()
        .includes(query);

    return !disabled && categoryMatch && statusMatch && queryMatch;
  });
}

export function mergeSettings(current: UserSettings, patch: Partial<UserSettings>): UserSettings {
  return {
    disabledCategories: patch.disabledCategories ? [...patch.disabledCategories] : [...current.disabledCategories],
    approvalRequiredFor: {
      ...current.approvalRequiredFor,
      ...patch.approvalRequiredFor,
    },
    weeklyBriefingDay: patch.weeklyBriefingDay ?? current.weeklyBriefingDay,
    timezone: patch.timezone ?? current.timezone,
  };
}

export function normalizeIntegrations(integrations: IntegrationConnection[]): IntegrationConnection[] {
  const byProvider = new Map(integrations.map((integration) => [integration.provider, integration]));
  return createDefaultIntegrations().map((integration) => ({
    ...integration,
    ...byProvider.get(integration.provider),
    provider: integration.provider,
  }));
}

function cloneStore(store: PlosDataStore): PlosDataStore {
  return {
    version: 1,
    messages: cloneMessages(store.messages),
    manualTasks: cloneManualTasks(store.manualTasks),
    documents: cloneDocuments(store.documents),
    settings: cloneSettings(store.settings),
    integrations: cloneIntegrations(store.integrations),
    auditLog: cloneAuditEvents(store.auditLog),
    approvals: cloneApprovals(store.approvals),
    rawMessages: cloneRawMessages(store.rawMessages),
    ingestionRuns: cloneIngestionRuns(store.ingestionRuns),
  };
}

function cloneMessages(messages: LifeAdminMessage[]): LifeAdminMessage[] {
  return messages.map((message) => cloneMessage(message) as LifeAdminMessage);
}

function cloneMessage(message: LifeAdminMessage | null): LifeAdminMessage | null {
  return message
    ? {
        ...message,
        extractedFields: message.extractedFields.map((field) => ({ ...field })),
      }
    : null;
}

function cloneManualTasks(tasks: ManualTask[]): ManualTask[] {
  return tasks.map((task) => cloneManualTask(task) as ManualTask);
}

function cloneManualTask(task: ManualTask | null): ManualTask | null {
  return task ? { ...task } : null;
}

function cloneDocuments(documents: DocumentRecord[]): DocumentRecord[] {
  return documents.map((document) => cloneDocument(document) as DocumentRecord);
}

function cloneDocument(document: DocumentRecord | null): DocumentRecord | null {
  return document ? { ...document } : null;
}

function cloneSettings(settings: UserSettings): UserSettings {
  return {
    disabledCategories: [...settings.disabledCategories],
    approvalRequiredFor: { ...settings.approvalRequiredFor },
    weeklyBriefingDay: settings.weeklyBriefingDay,
    timezone: settings.timezone,
  };
}

function cloneIntegrations(integrations: IntegrationConnection[]): IntegrationConnection[] {
  return integrations.map((integration) => cloneIntegration(integration) as IntegrationConnection);
}

function cloneIntegration(integration: IntegrationConnection | null): IntegrationConnection | null {
  return integration ? { ...integration, permissionScopes: [...integration.permissionScopes] } : null;
}

function cloneAuditEvents(events: AuditEvent[]): AuditEvent[] {
  return events.map((event) => cloneAuditEvent(event) as AuditEvent);
}

function cloneAuditEvent(event: AuditEvent | null): AuditEvent | null {
  return event ? { ...event, metadata: event.metadata ? { ...event.metadata } : undefined } : null;
}

function cloneApprovals(approvals: ApprovalRequest[]): ApprovalRequest[] {
  return approvals.map((approval) => cloneApproval(approval) as ApprovalRequest);
}

function cloneApproval(approval: ApprovalRequest | null): ApprovalRequest | null {
  return approval ? { ...approval } : null;
}

function cloneRawMessages(messages: RawLifeAdminMessage[]): RawLifeAdminMessage[] {
  return messages.map((message) => cloneRawMessage(message) as RawLifeAdminMessage);
}

function cloneRawMessage(message: RawLifeAdminMessage | null): RawLifeAdminMessage | null {
  return message ? { ...message } : null;
}

function cloneIngestionRuns(runs: IngestionRun[]): IngestionRun[] {
  return runs.map((run) => cloneIngestionRun(run) as IngestionRun);
}

function cloneIngestionRun(run: IngestionRun | null): IngestionRun | null {
  return run ? { ...run, createdItemIds: [...run.createdItemIds] } : null;
}

function toDate(value?: string | null): Date | null {
  return value ? new Date(value) : null;
}

function toIso(value?: Date | null): string | undefined {
  return value ? value.toISOString() : undefined;
}

function parseJsonArray<T>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) return [...fallback];

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed as T[] : [...fallback];
  } catch {
    return [...fallback];
  }
}

function parseJsonObject(value: string | null | undefined): Record<string, string | number | boolean | null> | undefined {
  if (!value) return undefined;

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, string | number | boolean | null>
      : undefined;
  } catch {
    return undefined;
  }
}

function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

function prismaMessageToLifeAdminMessage(message: {
  id: string;
  title: string;
  category: string;
  source: string;
  sender: string;
  receivedAt: Date;
  dueDate: Date | null;
  priority: string;
  suggestedAction: string;
  confidence: number;
  status: string;
  originalMessage: string;
  flaggedReason: string;
  extractedFieldsJson: string;
  financialImpact: number | null;
  documentSaveRecommended: boolean;
  documentSavedAt: Date | null;
  needsReply: boolean;
  appointmentStart: Date | null;
  snoozedUntil: Date | null;
  taskCreatedAt: Date | null;
  updatedAt: Date;
}): LifeAdminMessage {
  return {
    id: message.id,
    title: message.title,
    category: message.category as LifeAdminMessage["category"],
    source: message.source as LifeAdminMessage["source"],
    sender: message.sender,
    receivedAt: message.receivedAt.toISOString(),
    dueDate: toIso(message.dueDate),
    priority: message.priority as LifeAdminMessage["priority"],
    suggestedAction: message.suggestedAction,
    confidence: message.confidence,
    status: message.status as LifeAdminStatus,
    originalMessage: message.originalMessage,
    flaggedReason: message.flaggedReason,
    extractedFields: parseJsonArray(message.extractedFieldsJson),
    financialImpact: message.financialImpact ?? undefined,
    documentSaveRecommended: message.documentSaveRecommended,
    documentSavedAt: toIso(message.documentSavedAt),
    needsReply: message.needsReply,
    appointmentStart: toIso(message.appointmentStart),
    snoozedUntil: toIso(message.snoozedUntil),
    taskCreatedAt: toIso(message.taskCreatedAt),
    updatedAt: message.updatedAt.toISOString(),
  };
}

function lifeAdminMessageToPrismaCreate(message: LifeAdminMessage) {
  return {
    id: message.id,
    title: message.title,
    category: message.category,
    source: message.source,
    sender: message.sender,
    receivedAt: new Date(message.receivedAt),
    dueDate: toDate(message.dueDate),
    priority: message.priority,
    suggestedAction: message.suggestedAction,
    confidence: message.confidence,
    status: message.status,
    originalMessage: message.originalMessage,
    flaggedReason: message.flaggedReason,
    extractedFieldsJson: stringifyJson(message.extractedFields),
    financialImpact: message.financialImpact ?? null,
    documentSaveRecommended: message.documentSaveRecommended ?? false,
    documentSavedAt: toDate(message.documentSavedAt),
    needsReply: message.needsReply ?? false,
    appointmentStart: toDate(message.appointmentStart),
    snoozedUntil: toDate(message.snoozedUntil),
    taskCreatedAt: toDate(message.taskCreatedAt),
  };
}

function lifeAdminMessagePatchToPrisma(patch: Partial<LifeAdminMessage>) {
  return {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.category !== undefined ? { category: patch.category } : {}),
    ...(patch.source !== undefined ? { source: patch.source } : {}),
    ...(patch.sender !== undefined ? { sender: patch.sender } : {}),
    ...(patch.receivedAt !== undefined ? { receivedAt: new Date(patch.receivedAt) } : {}),
    ...(patch.dueDate !== undefined ? { dueDate: toDate(patch.dueDate) } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.suggestedAction !== undefined ? { suggestedAction: patch.suggestedAction } : {}),
    ...(patch.confidence !== undefined ? { confidence: patch.confidence } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.originalMessage !== undefined ? { originalMessage: patch.originalMessage } : {}),
    ...(patch.flaggedReason !== undefined ? { flaggedReason: patch.flaggedReason } : {}),
    ...(patch.extractedFields !== undefined ? { extractedFieldsJson: stringifyJson(patch.extractedFields) } : {}),
    ...(patch.financialImpact !== undefined ? { financialImpact: patch.financialImpact ?? null } : {}),
    ...(patch.documentSaveRecommended !== undefined ? { documentSaveRecommended: patch.documentSaveRecommended } : {}),
    ...(patch.documentSavedAt !== undefined ? { documentSavedAt: toDate(patch.documentSavedAt) } : {}),
    ...(patch.needsReply !== undefined ? { needsReply: patch.needsReply } : {}),
    ...(patch.appointmentStart !== undefined ? { appointmentStart: toDate(patch.appointmentStart) } : {}),
    ...(patch.snoozedUntil !== undefined ? { snoozedUntil: toDate(patch.snoozedUntil) } : {}),
    ...(patch.taskCreatedAt !== undefined ? { taskCreatedAt: toDate(patch.taskCreatedAt) } : {}),
  };
}

function prismaManualTaskToManualTask(task: {
  id: string;
  sourceMessageId: string | null;
  title: string;
  category: string;
  dueDate: Date | null;
  priority: string;
  status: string;
  suggestedAction: string;
  createdAt: Date;
  updatedAt: Date;
  snoozedUntil: Date | null;
}): ManualTask {
  return {
    id: task.id,
    sourceMessageId: task.sourceMessageId ?? undefined,
    title: task.title,
    category: task.category as ManualTask["category"],
    dueDate: toIso(task.dueDate),
    priority: task.priority as ManualTask["priority"],
    status: task.status as ManualTask["status"],
    suggestedAction: task.suggestedAction,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    snoozedUntil: toIso(task.snoozedUntil),
  };
}

function manualTaskToPrismaCreate(task: ManualTask) {
  return {
    id: task.id,
    sourceMessageId: task.sourceMessageId ?? null,
    title: task.title,
    category: task.category,
    dueDate: toDate(task.dueDate),
    priority: task.priority,
    status: task.status,
    suggestedAction: task.suggestedAction,
    createdAt: new Date(task.createdAt),
    updatedAt: new Date(task.updatedAt),
    snoozedUntil: toDate(task.snoozedUntil),
  };
}

function manualTaskPatchToPrisma(patch: Partial<ManualTask>) {
  return {
    ...(patch.sourceMessageId !== undefined ? { sourceMessageId: patch.sourceMessageId ?? null } : {}),
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.category !== undefined ? { category: patch.category } : {}),
    ...(patch.dueDate !== undefined ? { dueDate: toDate(patch.dueDate) } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.suggestedAction !== undefined ? { suggestedAction: patch.suggestedAction } : {}),
    ...(patch.snoozedUntil !== undefined ? { snoozedUntil: toDate(patch.snoozedUntil) } : {}),
  };
}

function prismaDocumentToDocumentRecord(document: {
  id: string;
  sourceMessageId: string;
  title: string;
  category: string;
  source: string;
  status: string;
  savedAt: Date;
  notes: string | null;
}): DocumentRecord {
  return {
    id: document.id,
    sourceMessageId: document.sourceMessageId,
    title: document.title,
    category: document.category as DocumentRecord["category"],
    source: document.source as DocumentRecord["source"],
    status: document.status as DocumentRecord["status"],
    savedAt: document.savedAt.toISOString(),
    notes: document.notes ?? undefined,
  };
}

function documentToPrismaCreate(document: DocumentRecord) {
  return {
    id: document.id,
    sourceMessageId: document.sourceMessageId,
    title: document.title,
    category: document.category,
    source: document.source,
    status: document.status,
    savedAt: new Date(document.savedAt),
    notes: document.notes ?? null,
  };
}

function documentToPrismaUpdate(document: DocumentRecord) {
  return {
    title: document.title,
    category: document.category,
    source: document.source,
    status: document.status,
    savedAt: new Date(document.savedAt),
    notes: document.notes ?? null,
  };
}

function prismaSettingsToUserSettings(settings: {
  disabledCategoriesJson: string;
  approvalSendingMessages: boolean;
  approvalPayments: boolean;
  approvalCancellations: boolean;
  weeklyBriefingDay: string;
  timezone: string;
}): UserSettings {
  return {
    disabledCategories: parseJsonArray(settings.disabledCategoriesJson),
    approvalRequiredFor: {
      sendingMessages: settings.approvalSendingMessages,
      payments: settings.approvalPayments,
      cancellations: settings.approvalCancellations,
    },
    weeklyBriefingDay: settings.weeklyBriefingDay as UserSettings["weeklyBriefingDay"],
    timezone: settings.timezone,
  };
}

function userSettingsToPrismaCreate(settings: UserSettings) {
  return {
    id: "default",
    disabledCategoriesJson: stringifyJson(settings.disabledCategories),
    approvalSendingMessages: settings.approvalRequiredFor.sendingMessages,
    approvalPayments: settings.approvalRequiredFor.payments,
    approvalCancellations: settings.approvalRequiredFor.cancellations,
    weeklyBriefingDay: settings.weeklyBriefingDay,
    timezone: settings.timezone,
  };
}

function userSettingsToPrismaUpdate(settings: UserSettings) {
  return {
    disabledCategoriesJson: stringifyJson(settings.disabledCategories),
    approvalSendingMessages: settings.approvalRequiredFor.sendingMessages,
    approvalPayments: settings.approvalRequiredFor.payments,
    approvalCancellations: settings.approvalRequiredFor.cancellations,
    weeklyBriefingDay: settings.weeklyBriefingDay,
    timezone: settings.timezone,
  };
}

function prismaIntegrationToIntegrationConnection(integration: {
  provider: string;
  label: string;
  status: string;
  permissionScopesJson: string;
  lastSyncAt: Date | null;
  connectedAt: Date | null;
  notes: string;
}): IntegrationConnection {
  return {
    provider: integration.provider as IntegrationProvider,
    label: integration.label,
    status: integration.status as IntegrationConnection["status"],
    permissionScopes: parseJsonArray(integration.permissionScopesJson),
    lastSyncAt: toIso(integration.lastSyncAt),
    connectedAt: toIso(integration.connectedAt),
    notes: integration.notes,
  };
}

function integrationToPrismaCreate(integration: IntegrationConnection) {
  return {
    provider: integration.provider,
    label: integration.label,
    status: integration.status,
    permissionScopesJson: stringifyJson(integration.permissionScopes),
    lastSyncAt: toDate(integration.lastSyncAt),
    connectedAt: toDate(integration.connectedAt),
    notes: integration.notes,
  };
}

function integrationPatchToPrisma(patch: Partial<IntegrationConnection>) {
  return {
    ...(patch.label !== undefined ? { label: patch.label } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.permissionScopes !== undefined ? { permissionScopesJson: stringifyJson(patch.permissionScopes) } : {}),
    ...(patch.lastSyncAt !== undefined ? { lastSyncAt: toDate(patch.lastSyncAt) } : {}),
    ...(patch.connectedAt !== undefined ? { connectedAt: toDate(patch.connectedAt) } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
  };
}

function prismaAuditEventToAuditEvent(event: {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: Date;
  metadataJson: string | null;
}): AuditEvent {
  return {
    id: event.id,
    type: event.type as AuditEvent["type"],
    entityType: event.entityType as AuditEvent["entityType"],
    entityId: event.entityId,
    summary: event.summary,
    createdAt: event.createdAt.toISOString(),
    metadata: parseJsonObject(event.metadataJson),
  };
}

function auditEventToPrismaCreate(event: AuditEvent) {
  return {
    id: event.id,
    type: event.type,
    entityType: event.entityType,
    entityId: event.entityId,
    summary: event.summary,
    createdAt: new Date(event.createdAt),
    metadataJson: event.metadata ? stringifyJson(event.metadata) : null,
  };
}

function prismaApprovalToApprovalRequest(approval: {
  id: string;
  actionType: string;
  sourceMessageId: string | null;
  title: string;
  description: string;
  riskLevel: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
  reviewerNote: string | null;
}): ApprovalRequest {
  return {
    id: approval.id,
    actionType: approval.actionType as ApprovalRequest["actionType"],
    sourceMessageId: approval.sourceMessageId ?? undefined,
    title: approval.title,
    description: approval.description,
    riskLevel: approval.riskLevel as ApprovalRequest["riskLevel"],
    status: approval.status as ApprovalRequest["status"],
    createdAt: approval.createdAt.toISOString(),
    updatedAt: approval.updatedAt.toISOString(),
    reviewedAt: toIso(approval.reviewedAt),
    reviewerNote: approval.reviewerNote ?? undefined,
  };
}

function approvalToPrismaCreate(approval: ApprovalRequest) {
  return {
    id: approval.id,
    actionType: approval.actionType,
    sourceMessageId: approval.sourceMessageId ?? null,
    title: approval.title,
    description: approval.description,
    riskLevel: approval.riskLevel,
    status: approval.status,
    createdAt: new Date(approval.createdAt),
    updatedAt: new Date(approval.updatedAt),
    reviewedAt: toDate(approval.reviewedAt),
    reviewerNote: approval.reviewerNote ?? null,
  };
}

function approvalPatchToPrisma(patch: Partial<ApprovalRequest>) {
  return {
    ...(patch.actionType !== undefined ? { actionType: patch.actionType } : {}),
    ...(patch.sourceMessageId !== undefined ? { sourceMessageId: patch.sourceMessageId ?? null } : {}),
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.riskLevel !== undefined ? { riskLevel: patch.riskLevel } : {}),
    ...(patch.status !== undefined ? { status: patch.status } : {}),
    ...(patch.reviewedAt !== undefined ? { reviewedAt: toDate(patch.reviewedAt) } : {}),
    ...(patch.reviewerNote !== undefined ? { reviewerNote: patch.reviewerNote ?? null } : {}),
  };
}

function prismaRawMessageToRawLifeAdminMessage(message: {
  id: string;
  provider: string;
  source: string;
  sender: string;
  subject: string;
  body: string;
  receivedAt: Date;
  externalId: string | null;
}): RawLifeAdminMessage {
  return {
    id: message.id,
    provider: message.provider as RawLifeAdminMessage["provider"],
    source: message.source as RawLifeAdminMessage["source"],
    sender: message.sender,
    subject: message.subject,
    body: message.body,
    receivedAt: message.receivedAt.toISOString(),
    externalId: message.externalId ?? undefined,
  };
}

function rawMessageToPrismaCreate(message: RawLifeAdminMessage) {
  return {
    id: message.id,
    provider: message.provider,
    source: message.source,
    sender: message.sender,
    subject: message.subject,
    body: message.body,
    receivedAt: new Date(message.receivedAt),
    externalId: message.externalId ?? null,
  };
}

function prismaIngestionRunToIngestionRun(run: {
  id: string;
  provider: string;
  status: string;
  startedAt: Date;
  completedAt: Date;
  inputCount: number;
  createdItemIdsJson: string;
  notes: string | null;
}): IngestionRun {
  return {
    id: run.id,
    provider: run.provider as IngestionRun["provider"],
    status: run.status as IngestionRun["status"],
    startedAt: run.startedAt.toISOString(),
    completedAt: run.completedAt.toISOString(),
    inputCount: run.inputCount,
    createdItemIds: parseJsonArray(run.createdItemIdsJson),
    notes: run.notes ?? undefined,
  };
}

function ingestionRunToPrismaCreate(run: IngestionRun) {
  return {
    id: run.id,
    provider: run.provider,
    status: run.status,
    startedAt: new Date(run.startedAt),
    completedAt: new Date(run.completedAt),
    inputCount: run.inputCount,
    createdItemIdsJson: stringifyJson(run.createdItemIds),
    notes: run.notes ?? null,
  };
}

function isPrismaNotFound(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2025";
}

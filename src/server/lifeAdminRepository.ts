import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { cwd } from "node:process";
import { mockMessages } from "@/data/mockMessages";
import type {
  AuditEvent,
  DocumentRecord,
  IntegrationConnection,
  IntegrationProvider,
  LifeAdminMessage,
  LifeAdminStatus,
  ManualTask,
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

  async resetStore(): Promise<PlosDataStore> {
    this.store = createSeedStore();
    return cloneStore(this.store);
  }

  async resetStatuses(): Promise<void> {
    this.store.messages = this.store.messages.map((message) => ({
      ...message,
      status: mockMessages.find((seed) => seed.id === message.id)?.status ?? "new",
      snoozedUntil: undefined,
      documentSavedAt: undefined,
      taskCreatedAt: undefined,
    }));
    this.store.manualTasks = [];
    this.store.documents = [];
  }
}

export class JsonFileLifeAdminRepository implements LifeAdminRepository {
  constructor(private readonly filePath = join(cwd(), ".data", "plos-store.json")) {}

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

  async resetStore(): Promise<PlosDataStore> {
    const store = createSeedStore();
    await this.writeStore(store);
    return cloneStore(store);
  }

  async resetStatuses(): Promise<void> {
    const store = await this.readStore();
    store.messages = store.messages.map((message) => ({
      ...message,
      status: mockMessages.find((seed) => seed.id === message.id)?.status ?? "new",
      snoozedUntil: undefined,
      documentSavedAt: undefined,
      taskCreatedAt: undefined,
    }));
    store.manualTasks = [];
    store.documents = [];
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

let repository: LifeAdminRepository = new JsonFileLifeAdminRepository();

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
  };
}

function applyMessageFilters(messages: LifeAdminMessage[], settings: UserSettings, filters: MessageFilters): LifeAdminMessage[] {
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

function mergeSettings(current: UserSettings, patch: Partial<UserSettings>): UserSettings {
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

function normalizeIntegrations(integrations: IntegrationConnection[]): IntegrationConnection[] {
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

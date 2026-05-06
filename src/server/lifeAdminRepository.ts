import { mockMessages } from "@/data/mockMessages";
import { applyStatusMap, updateStatusMap } from "@/lib/status";
import type { LifeAdminMessage, LifeAdminStatus, StatusMap } from "@/lib/types";

export interface LifeAdminRepository {
  listMessages(): Promise<LifeAdminMessage[]>;
  getMessage(id: string): Promise<LifeAdminMessage | null>;
  updateStatus(id: string, status: LifeAdminStatus): Promise<LifeAdminMessage | null>;
  resetStatuses(): Promise<void>;
}

export class MockLifeAdminRepository implements LifeAdminRepository {
  private readonly seedMessages: LifeAdminMessage[];
  private statusMap: StatusMap;

  constructor(seedMessages: LifeAdminMessage[] = mockMessages, initialStatuses: StatusMap = {}) {
    this.seedMessages = cloneMessages(seedMessages);
    this.statusMap = { ...initialStatuses };
  }

  async listMessages(): Promise<LifeAdminMessage[]> {
    return cloneMessages(applyStatusMap(this.seedMessages, this.statusMap));
  }

  async getMessage(id: string): Promise<LifeAdminMessage | null> {
    const messages = await this.listMessages();
    return messages.find((message) => message.id === id) ?? null;
  }

  async updateStatus(id: string, status: LifeAdminStatus): Promise<LifeAdminMessage | null> {
    const exists = this.seedMessages.some((message) => message.id === id);

    if (!exists) {
      return null;
    }

    this.statusMap = updateStatusMap(this.statusMap, id, status);
    return this.getMessage(id);
  }

  async resetStatuses(): Promise<void> {
    this.statusMap = {};
  }
}

let repository: LifeAdminRepository = new MockLifeAdminRepository();

export function getLifeAdminRepository(): LifeAdminRepository {
  return repository;
}

export function setLifeAdminRepository(nextRepository: LifeAdminRepository): void {
  repository = nextRepository;
}

function cloneMessages(messages: LifeAdminMessage[]): LifeAdminMessage[] {
  return messages.map((message) => ({
    ...message,
    extractedFields: message.extractedFields.map((field) => ({ ...field })),
  }));
}

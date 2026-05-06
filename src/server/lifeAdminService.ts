import { calculateLifeAdminScore, createWeeklyBriefing, daysUntil, generateTasks } from "@/lib/prioritization";
import type { BriefingSummary, LifeAdminMessage, LifeAdminStatus, LifeAdminTask } from "@/lib/types";
import { getLifeAdminRepository, type LifeAdminRepository } from "@/server/lifeAdminRepository";

export const lifeAdminStatuses: LifeAdminStatus[] = ["new", "reviewed", "completed", "ignored"];

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
  };
}

export class LifeAdminService {
  constructor(private readonly repository: LifeAdminRepository = getLifeAdminRepository()) {}

  async listMessages(): Promise<LifeAdminMessage[]> {
    return this.repository.listMessages();
  }

  async getMessage(id: string): Promise<LifeAdminMessage | null> {
    return this.repository.getMessage(id);
  }

  async updateStatus(id: string, status: LifeAdminStatus): Promise<LifeAdminMessage | null> {
    return this.repository.updateStatus(id, status);
  }

  async listTasks(now = new Date()): Promise<LifeAdminTask[]> {
    const messages = await this.repository.listMessages();
    return generateTasks(messages, now);
  }

  async getBriefing(now = new Date()): Promise<BriefingSummary> {
    const messages = await this.repository.listMessages();
    return createWeeklyBriefing(messages, now);
  }

  async getDashboardSummary(now = new Date()): Promise<DashboardSummary> {
    const messages = await this.repository.listMessages();
    const active = messages.filter((message) => message.status !== "completed" && message.status !== "ignored");
    const priorityTasks = generateTasks(messages, now).slice(0, 8);

    return {
      lifeAdminScore: calculateLifeAdminScore(messages, now),
      priorityTasks,
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
        documentsToSave: active.filter((message) => message.documentSaveRecommended).length,
        messagesNeedingReply: active.filter((message) => message.needsReply).length,
        subscriptionWarnings: active.filter((message) => message.category === "subscription").length,
      },
    };
  }

  async resetStatuses(): Promise<void> {
    await this.repository.resetStatuses();
  }
}

export function getLifeAdminService(): LifeAdminService {
  return new LifeAdminService();
}

export function isLifeAdminStatus(value: unknown): value is LifeAdminStatus {
  return typeof value === "string" && lifeAdminStatuses.includes(value as LifeAdminStatus);
}

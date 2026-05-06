import { describe, expect, it } from "vitest";
import { LifeAdminService } from "@/server/lifeAdminService";
import { MockLifeAdminRepository } from "@/server/lifeAdminRepository";

const now = new Date("2026-05-06T09:00:00-05:00");

describe("LifeAdminService", () => {
  it("updates status through the repository boundary", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const updated = await service.updateStatus("msg-credit-card-bill", "completed");
    const found = await service.getMessage("msg-credit-card-bill");

    expect(updated?.status).toBe("completed");
    expect(found?.status).toBe("completed");
  });

  it("keeps ignored messages out of generated tasks", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    await service.updateStatus("msg-fraud-alert", "ignored");

    const tasks = await service.listTasks(now);

    expect(tasks.map((task) => task.messageId)).not.toContain("msg-fraud-alert");
  });

  it("creates a dashboard summary with active counts", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const dashboard = await service.getDashboardSummary(now);

    expect(dashboard.lifeAdminScore).toBeGreaterThanOrEqual(0);
    expect(dashboard.priorityTasks.length).toBeGreaterThan(0);
    expect(dashboard.counts.dueThisWeek).toBeGreaterThan(0);
    expect(dashboard.counts.documentsToSave).toBeGreaterThan(0);
  });
});

import { describe, expect, it } from "vitest";
import { LifeAdminService } from "@/server/lifeAdminService";
import { JsonFileLifeAdminRepository, MockLifeAdminRepository } from "@/server/lifeAdminRepository";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

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

  it("saves documents and writes audit events from item actions", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const result = await service.performItemAction("msg-tax-document", {
      action: "save_document",
      notes: "Keep for annual tax records.",
    });
    const documents = await service.listDocuments();
    const auditLog = await service.listAuditEvents();

    expect(result?.document?.sourceMessageId).toBe("msg-tax-document");
    expect(result?.item.documentSavedAt).toBeTruthy();
    expect(documents).toHaveLength(1);
    expect(auditLog.some((event) => event.type === "document_saved")).toBe(true);
  });

  it("creates manual tasks from inbox actions", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const result = await service.performItemAction("msg-car-insurance-renewal", {
      action: "create_task",
      taskTitle: "Compare auto policy renewal",
    });
    const tasks = await service.listManualTasks();

    expect(result?.task?.title).toBe("Compare auto policy renewal");
    expect(result?.item.taskCreatedAt).toBeTruthy();
    expect(tasks).toHaveLength(1);
  });

  it("hides disabled categories unless requested", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    await service.updateSettings({ disabledCategories: ["medical"] });

    const filtered = await service.listMessages();
    const unfiltered = await service.listMessages({ includeDisabledCategories: true });

    expect(filtered.every((item) => item.category !== "medical")).toBe(true);
    expect(unfiltered.some((item) => item.category === "medical")).toBe(true);
  });

  it("persists local JSON store changes across repository instances", async () => {
    const directory = await mkdtemp(join(tmpdir(), "plos-store-"));
    const filePath = join(directory, "store.json");

    try {
      const first = new LifeAdminService(new JsonFileLifeAdminRepository(filePath));
      await first.updateStatus("msg-credit-card-bill", "completed");

      const second = new LifeAdminService(new JsonFileLifeAdminRepository(filePath));
      const item = await second.getMessage("msg-credit-card-bill");

      expect(item?.status).toBe("completed");
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});

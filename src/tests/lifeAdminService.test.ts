import { describe, expect, it } from "vitest";
import { LifeAdminService } from "@/server/lifeAdminService";
import { getJsonStorePath, JsonFileLifeAdminRepository, MockLifeAdminRepository } from "@/server/lifeAdminRepository";
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

  it("keeps document saves idempotent", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const first = await service.performItemAction("msg-tax-document", { action: "save_document" });
    const second = await service.performItemAction("msg-tax-document", { action: "save_document" });
    const documents = await service.listDocuments();
    const auditLog = await service.listAuditEvents();

    expect(second?.document?.id).toBe(first?.document?.id);
    expect(documents).toHaveLength(1);
    expect(auditLog.filter((event) => event.type === "document_saved")).toHaveLength(1);
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

  it("keeps source-backed task creation idempotent", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const first = await service.performItemAction("msg-car-insurance-renewal", {
      action: "create_task",
      taskTitle: "Compare auto policy renewal",
    });
    const second = await service.performItemAction("msg-car-insurance-renewal", {
      action: "create_task",
      taskTitle: "Duplicate click should not create this",
    });
    const tasks = await service.listManualTasks();
    const auditLog = await service.listAuditEvents();

    expect(second?.task?.id).toBe(first?.task?.id);
    expect(second?.task?.title).toBe("Compare auto policy renewal");
    expect(tasks).toHaveLength(1);
    expect(auditLog.filter((event) => event.type === "task_created")).toHaveLength(1);
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

  it("uses writable temp storage for JSON demo mode on Vercel", async () => {
    const originalVercel = process.env.VERCEL;
    const originalDataFile = process.env.PLOS_DATA_FILE;

    try {
      process.env.VERCEL = "1";
      delete process.env.PLOS_DATA_FILE;

      expect(getJsonStorePath()).toContain("plos-store.json");
      expect(getJsonStorePath()).not.toContain(".data");
    } finally {
      if (originalVercel === undefined) {
        delete process.env.VERCEL;
      } else {
        process.env.VERCEL = originalVercel;
      }

      if (originalDataFile === undefined) {
        delete process.env.PLOS_DATA_FILE;
      } else {
        process.env.PLOS_DATA_FILE = originalDataFile;
      }
    }
  });

  it("initializes the Vercel JSON store safely under parallel first reads", async () => {
    const directory = await mkdtemp(join(tmpdir(), "plos-vercel-store-"));
    const originalVercel = process.env.VERCEL;
    const originalDataFile = process.env.PLOS_DATA_FILE;

    try {
      process.env.VERCEL = "1";
      process.env.PLOS_DATA_FILE = join(directory, "store.json");

      const repositories = Array.from({ length: 6 }, () => new JsonFileLifeAdminRepository(getJsonStorePath()));
      const results = await Promise.all(repositories.map((repository) => repository.listMessages()));

      expect(results).toHaveLength(6);
      expect(results.every((messages) => messages.length >= 20)).toBe(true);
    } finally {
      if (originalVercel === undefined) {
        delete process.env.VERCEL;
      } else {
        process.env.VERCEL = originalVercel;
      }

      if (originalDataFile === undefined) {
        delete process.env.PLOS_DATA_FILE;
      } else {
        process.env.PLOS_DATA_FILE = originalDataFile;
      }

      await rm(directory, { recursive: true, force: true });
    }
  });

  it("creates and reviews approval requests with audit history", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const approval = await service.createApproval({
      actionType: "make_payment",
      title: "Pay medical bill",
      description: "Approve payment only after reviewing the EOB.",
      sourceMessageId: "msg-medical-bill",
    });
    const reviewed = await service.reviewApproval(approval.id, "approved", "Looks correct.");
    const auditLog = await service.listAuditEvents();

    expect(approval.status).toBe("pending");
    expect(approval.riskLevel).toBe("high");
    expect(reviewed?.status).toBe("approved");
    expect(auditLog.map((event) => event.type)).toEqual(expect.arrayContaining(["approval_created", "approval_reviewed"]));
  });

  it("keeps pending approval creation idempotent", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const input = {
      actionType: "make_payment" as const,
      title: "Pay medical bill",
      description: "Approve payment only after reviewing the EOB.",
      sourceMessageId: "msg-medical-bill",
    };
    const first = await service.createApproval(input);
    const second = await service.createApproval(input);
    const approvals = await service.listApprovals();
    const auditLog = await service.listAuditEvents();

    expect(second.id).toBe(first.id);
    expect(approvals).toHaveLength(1);
    expect(auditLog.filter((event) => event.type === "approval_created")).toHaveLength(1);
  });

  it("ingests raw messages into normalized life-admin items", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const result = await service.ingestRawMessages({
      provider: "gmail",
      messages: [
        {
          id: "raw-cloudnest",
          source: "Gmail",
          sender: "CloudNest",
          subject: "Your trial ends May 8",
          body: "Your premium plan trial ends May 8 and will renew for $19.99/month.",
          receivedAt: "2026-05-05T10:00:00-05:00",
        },
      ],
      notes: "Test ingest",
    });
    const item = await service.getMessage("msg-raw-cloudnest");
    const runs = await service.listIngestionRuns();

    expect(result.items[0]?.category).toBe("renewal");
    expect(item?.financialImpact).toBe(19.99);
    expect(runs[0]?.createdItemIds).toContain("msg-raw-cloudnest");
    expect(runs[0]?.status).toBe("completed");
    expect(runs[0]?.duplicateCount).toBe(0);
    expect(runs[0]?.failedCount).toBe(0);
    expect(runs[0]?.cursor).toContain("gmail:");
  });

  it("deduplicates retried ingestion by provider external id", async () => {
    const repository = new MockLifeAdminRepository();
    const service = new LifeAdminService(repository);
    const first = await service.ingestRawMessages({
      provider: "gmail",
      messages: [
        {
          id: "raw-cloudnest-first",
          externalId: "gmail-cloudnest-001",
          source: "Gmail",
          sender: "CloudNest",
          subject: "Your trial ends May 8",
          body: "Your premium plan trial ends May 8 and will renew for $19.99/month.",
          receivedAt: "2026-05-05T10:00:00-05:00",
        },
      ],
    });
    const second = await service.ingestRawMessages({
      provider: "gmail",
      messages: [
        {
          id: "raw-cloudnest-retry",
          externalId: "gmail-cloudnest-001",
          source: "Gmail",
          sender: "CloudNest",
          subject: "Your trial ends May 8",
          body: "Your premium plan trial ends May 8 and will renew for $19.99/month.",
          receivedAt: "2026-05-05T10:00:00-05:00",
        },
      ],
    });
    const rawMessages = await repository.listRawMessages();
    const runs = await service.listIngestionRuns();

    expect(first.items[0]?.id).toBe("msg-raw-cloudnest-first");
    expect(second.items[0]?.id).toBe("msg-raw-cloudnest-first");
    expect(second.run.createdItemIds).toHaveLength(0);
    expect(second.run.duplicateCount).toBe(1);
    expect(second.run.failedCount).toBe(0);
    expect(rawMessages).toHaveLength(1);
    expect(runs).toHaveLength(2);
  });

  it("deduplicates repeated raw messages inside one ingestion batch", async () => {
    const repository = new MockLifeAdminRepository();
    const service = new LifeAdminService(repository);
    const result = await service.ingestRawMessages({
      provider: "gmail",
      messages: [
        {
          id: "raw-duplicate-tax",
          source: "Gmail",
          sender: "BrightPath Brokerage",
          subject: "Tax document available May 9",
          body: "Your corrected 1099 tax document is available May 9.",
          receivedAt: "2026-05-05T10:00:00-05:00",
        },
        {
          id: "raw-duplicate-tax",
          source: "Gmail",
          sender: "BrightPath Brokerage",
          subject: "Tax document available May 9",
          body: "Your corrected 1099 tax document is available May 9.",
          receivedAt: "2026-05-05T10:00:00-05:00",
        },
      ],
    });
    const rawMessages = await repository.listRawMessages();

    expect(result.items).toHaveLength(2);
    expect(result.items.every((item) => item.id === "msg-raw-duplicate-tax")).toBe(true);
    expect(result.run.createdItemIds).toEqual(["msg-raw-duplicate-tax"]);
    expect(result.run.duplicateCount).toBe(1);
    expect(rawMessages).toHaveLength(1);
  });

  it("records partial ingestion failures without dropping successful items", async () => {
    class FailingCreateRepository extends MockLifeAdminRepository {
      async createMessage(message: Parameters<MockLifeAdminRepository["createMessage"]>[0]) {
        if (message.id === "msg-raw-fail") {
          throw new Error("Simulated parser persistence failure");
        }

        return super.createMessage(message);
      }
    }

    const service = new LifeAdminService(new FailingCreateRepository());
    const result = await service.ingestRawMessages({
      provider: "gmail",
      messages: [
        {
          id: "raw-ok",
          source: "Gmail",
          sender: "BrightPath Brokerage",
          subject: "Tax document available May 9",
          body: "Your corrected 1099 tax document is available May 9.",
          receivedAt: "2026-05-05T10:00:00-05:00",
        },
        {
          id: "raw-fail",
          source: "Gmail",
          sender: "CloudNest",
          subject: "Your trial ends May 8",
          body: "Your premium plan trial ends May 8 and will renew for $19.99/month.",
          receivedAt: "2026-05-05T10:30:00-05:00",
        },
      ],
    });

    expect(result.items.map((item) => item.id)).toEqual(["msg-raw-ok"]);
    expect(result.run.status).toBe("partial");
    expect(result.run.createdItemIds).toEqual(["msg-raw-ok"]);
    expect(result.run.failedCount).toBe(1);
    expect(result.run.errorMessages[0]).toContain("Simulated parser persistence failure");
  });

  it("generates recommendations and accepts sensitive actions as approvals", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const recommendations = await service.listRecommendations(now);
    const paymentRecommendation = recommendations.find(
      (recommendation) => recommendation.actionType === "create_approval" && recommendation.approvalActionType === "make_payment",
    );

    expect(paymentRecommendation).toBeTruthy();

    const result = await service.acceptRecommendation(paymentRecommendation?.id ?? "");
    const approvals = await service.listApprovals();

    expect(result?.approval?.actionType).toBe("make_payment");
    expect(approvals.some((approval) => approval.id === result?.approval?.id)).toBe(true);
  });

  it("accepts the same approval recommendation idempotently", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const recommendations = await service.listRecommendations(now);
    const paymentRecommendation = recommendations.find(
      (recommendation) => recommendation.actionType === "create_approval" && recommendation.approvalActionType === "make_payment",
    );

    expect(paymentRecommendation).toBeTruthy();

    const first = await service.acceptRecommendation(paymentRecommendation?.id ?? "");
    const second = await service.acceptRecommendation(paymentRecommendation?.id ?? "");
    const approvals = await service.listApprovals();
    const auditLog = await service.listAuditEvents();

    expect(second?.approval?.id).toBe(first?.approval?.id);
    expect(approvals).toHaveLength(1);
    expect(auditLog.filter((event) => event.type === "approval_created")).toHaveLength(1);
  });

  it("accepts document recommendations by saving records", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const recommendations = await service.listRecommendations(now);
    const documentRecommendation = recommendations.find((recommendation) => recommendation.actionType === "save_document");

    expect(documentRecommendation).toBeTruthy();

    const result = await service.acceptRecommendation(documentRecommendation?.id ?? "");
    const documents = await service.listDocuments();

    expect(result?.document?.sourceMessageId).toBe(documentRecommendation?.sourceMessageId);
    expect(documents.some((document) => document.id === result?.document?.id)).toBe(true);
  });

  it("accepts the same document recommendation idempotently", async () => {
    const service = new LifeAdminService(new MockLifeAdminRepository());
    const recommendations = await service.listRecommendations(now);
    const documentRecommendation = recommendations.find((recommendation) => recommendation.actionType === "save_document");

    expect(documentRecommendation).toBeTruthy();

    const first = await service.acceptRecommendation(documentRecommendation?.id ?? "");
    const second = await service.acceptRecommendation(documentRecommendation?.id ?? "");
    const documents = await service.listDocuments();

    expect(second?.document?.id).toBe(first?.document?.id);
    expect(documents).toHaveLength(1);
  });
});

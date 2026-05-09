import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { LifeAdminService } from "@/server/lifeAdminService";
import { PrismaLifeAdminRepository } from "@/server/lifeAdminRepository";

function sqliteUrl(path: string): string {
  return `file:${path.split(sep).join("/")}`;
}

async function applyMigration(prisma: PrismaClient): Promise<void> {
  const migration = await readFile(join(process.cwd(), "prisma", "migrations", "00000000000000_init", "migration.sql"), "utf8");
  const statements = migration
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await prisma.$executeRawUnsafe(statement);
  }
}

describe("PrismaLifeAdminRepository", () => {
  let directory: string;
  let prisma: PrismaClient;
  let repository: PrismaLifeAdminRepository;
  let service: LifeAdminService;

  beforeAll(async () => {
    directory = await mkdtemp(join(tmpdir(), "plos-prisma-"));
    const databaseUrl = sqliteUrl(join(directory, "test.db"));
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
    await applyMigration(prisma);
    repository = new PrismaLifeAdminRepository(prisma);
    service = new LifeAdminService(repository);
  }, 60_000);

  beforeEach(async () => {
    await repository.resetStore();
  });

  afterAll(async () => {
    await prisma?.$disconnect();
    if (directory) {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("seeds messages, settings, and integrations into SQLite", async () => {
    const [messages, settings, integrations] = await Promise.all([
      repository.listMessages(),
      repository.getSettings(),
      repository.listIntegrations(),
    ]);

    expect(messages.length).toBeGreaterThanOrEqual(20);
    expect(settings.approvalRequiredFor.payments).toBe(true);
    expect(integrations.map((integration) => integration.provider)).toEqual(
      expect.arrayContaining(["gmail", "google-calendar", "plaid", "health"]),
    );
  });

  it("persists status updates, manual tasks, documents, and audit events", async () => {
    await service.updateStatus("msg-credit-card-bill", "completed");
    const taskResult = await service.performItemAction("msg-car-insurance-renewal", {
      action: "create_task",
      taskTitle: "Compare auto policy renewal",
    });
    const documentResult = await service.performItemAction("msg-tax-document", {
      action: "save_document",
      notes: "Store for annual taxes.",
    });

    const secondRepository = new PrismaLifeAdminRepository(prisma);
    const [bill, tasks, documents, auditLog] = await Promise.all([
      secondRepository.getMessage("msg-credit-card-bill"),
      secondRepository.listManualTasks(),
      secondRepository.listDocuments(),
      secondRepository.listAuditEvents(),
    ]);

    expect(bill?.status).toBe("completed");
    expect(taskResult?.task?.title).toBe("Compare auto policy renewal");
    expect(documentResult?.document?.sourceMessageId).toBe("msg-tax-document");
    expect(tasks.some((task) => task.title === "Compare auto policy renewal")).toBe(true);
    expect(documents.some((document) => document.sourceMessageId === "msg-tax-document")).toBe(true);
    expect(auditLog.map((event) => event.type)).toEqual(expect.arrayContaining(["status_updated", "task_created", "document_saved"]));
  });

  it("handles approvals, ingestion, recommendations, and reset through Prisma", async () => {
    const approval = await service.createApproval({
      actionType: "cancel_subscription",
      title: "Cancel free trial",
      description: "Requires explicit user approval before canceling.",
      sourceMessageId: "msg-free-trial",
    });
    const reviewed = await service.reviewApproval(approval.id, "approved", "Approved in test.");
    const ingest = await service.ingestRawMessages({
      provider: "gmail",
      messages: [
        {
          id: "raw-prisma-tax",
          source: "Gmail",
          sender: "BrightPath Brokerage",
          subject: "Tax document available May 9",
          body: "Your corrected 1099 tax document is available May 9.",
          receivedAt: "2026-05-05T10:00:00-05:00",
        },
      ],
    });
    const recommendations = await service.listRecommendations(new Date("2026-05-06T09:00:00-05:00"));

    expect(reviewed?.status).toBe("approved");
    expect(ingest.items[0]).toMatchObject({ id: "msg-raw-prisma-tax", category: "tax/document" });
    expect(recommendations.length).toBeGreaterThan(0);

    await repository.resetStatuses();
    const [approvals, rawMessages, runs, ingestedItem] = await Promise.all([
      repository.listApprovals(),
      repository.listRawMessages(),
      repository.listIngestionRuns(),
      repository.getMessage("msg-raw-prisma-tax"),
    ]);

    expect(approvals).toHaveLength(0);
    expect(rawMessages).toHaveLength(0);
    expect(runs).toHaveLength(0);
    expect(ingestedItem).toBeNull();
  });

  it("keeps service actions idempotent in Prisma mode", async () => {
    const firstTask = await service.performItemAction("msg-car-insurance-renewal", {
      action: "create_task",
      taskTitle: "Compare auto policy renewal",
    });
    const secondTask = await service.performItemAction("msg-car-insurance-renewal", {
      action: "create_task",
      taskTitle: "Duplicate task from retry",
    });
    const firstDocument = await service.performItemAction("msg-tax-document", { action: "save_document" });
    const secondDocument = await service.performItemAction("msg-tax-document", { action: "save_document" });
    const approvalInput = {
      actionType: "make_payment" as const,
      title: "Approve payment review for Medical bill from Lakeside Clinic",
      description: "Review amount, due date, and source before any payment.",
      sourceMessageId: "msg-medical-bill",
    };
    const firstApproval = await service.createApproval(approvalInput);
    const secondApproval = await service.createApproval(approvalInput);

    const [tasks, documents, approvals, auditLog] = await Promise.all([
      repository.listManualTasks(),
      repository.listDocuments(),
      repository.listApprovals(),
      repository.listAuditEvents(),
    ]);

    expect(secondTask?.task?.id).toBe(firstTask?.task?.id);
    expect(secondDocument?.document?.id).toBe(firstDocument?.document?.id);
    expect(secondApproval.id).toBe(firstApproval.id);
    expect(tasks.filter((task) => task.sourceMessageId === "msg-car-insurance-renewal")).toHaveLength(1);
    expect(documents.filter((document) => document.sourceMessageId === "msg-tax-document")).toHaveLength(1);
    expect(approvals.filter((approval) => approval.sourceMessageId === "msg-medical-bill")).toHaveLength(1);
    expect(auditLog.filter((event) => event.type === "task_created")).toHaveLength(1);
    expect(auditLog.filter((event) => event.type === "document_saved")).toHaveLength(1);
    expect(auditLog.filter((event) => event.type === "approval_created")).toHaveLength(1);
  });
});

import { ok, serverError } from "@/server/apiResponses";
import { getLifeAdminRepository } from "@/server/lifeAdminRepository";

export async function GET() {
  try {
    const repository = getLifeAdminRepository();
    const [messages, tasks, documents, settings, integrations, approvals, auditLog, ingestionRuns] = await Promise.all([
      repository.listMessages({ includeDisabledCategories: true }),
      repository.listManualTasks(),
      repository.listDocuments(),
      repository.getSettings(),
      repository.listIntegrations(),
      repository.listApprovals(),
      repository.listAuditEvents(1),
      repository.listIngestionRuns(),
    ]);

    return ok({
      ok: true,
      repository: process.env.PLOS_REPOSITORY === "prisma" ? "prisma" : "json",
      checkedAt: new Date().toISOString(),
      counts: {
        messages: messages.length,
        manualTasks: tasks.length,
        documents: documents.length,
        integrations: integrations.length,
        approvals: approvals.length,
        auditEventsSampled: auditLog.length,
        ingestionRuns: ingestionRuns.length,
      },
      checks: [
        {
          name: "Seed messages",
          ok: messages.length >= 20,
          detail: `${messages.length} message(s) available`,
        },
        {
          name: "Settings",
          ok: Boolean(settings.timezone && settings.weeklyBriefingDay),
          detail: `${settings.weeklyBriefingDay} briefing in ${settings.timezone}`,
        },
        {
          name: "Integration registry",
          ok: integrations.length === 4,
          detail: `${integrations.length} connector boundary record(s)`,
        },
      ],
    });
  } catch (error) {
    return serverError(error);
  }
}

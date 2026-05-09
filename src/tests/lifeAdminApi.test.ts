import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PATCH as patchApproval } from "@/app/api/life-admin/approvals/[id]/route";
import { GET as getApprovals, POST as postApproval } from "@/app/api/life-admin/approvals/route";
import { GET as getAudit } from "@/app/api/life-admin/audit/route";
import { GET as getDocuments } from "@/app/api/life-admin/documents/route";
import { GET as getIntegrations } from "@/app/api/life-admin/integrations/route";
import { PATCH as patchIntegration } from "@/app/api/life-admin/integrations/[provider]/route";
import { GET as getHealth } from "@/app/api/life-admin/health/route";
import { POST as postIngest } from "@/app/api/life-admin/ingest/route";
import { GET as getIngestRuns } from "@/app/api/life-admin/ingest/runs/route";
import { POST as postAction } from "@/app/api/life-admin/items/[id]/action/route";
import { GET as getItems } from "@/app/api/life-admin/items/route";
import { GET as getItem, PATCH as patchItem } from "@/app/api/life-admin/items/[id]/route";
import { POST as acceptRecommendation } from "@/app/api/life-admin/recommendations/[id]/accept/route";
import { GET as getRecommendations } from "@/app/api/life-admin/recommendations/route";
import { GET as getSettings, PATCH as patchSettings } from "@/app/api/life-admin/settings/route";
import { GET as getTasks } from "@/app/api/life-admin/tasks/route";
import { MockLifeAdminRepository, setLifeAdminRepository } from "@/server/lifeAdminRepository";

describe("life-admin API routes", () => {
  beforeEach(() => {
    setLifeAdminRepository(new MockLifeAdminRepository());
  });

  afterEach(() => {
    setLifeAdminRepository(new MockLifeAdminRepository());
  });

  it("returns mock life-admin items", async () => {
    const response = await getItems(new Request("http://localhost/api/life-admin/items"));
    const body = (await response.json()) as { items: unknown[] };

    expect(response.status).toBe(200);
    expect(body.items.length).toBeGreaterThanOrEqual(20);
  });

  it("returns backend health checks", async () => {
    const response = await getHealth();
    const body = (await response.json()) as {
      ok: boolean;
      counts: { messages: number; integrations: number };
      checks: Array<{ name: string; ok: boolean }>;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.counts.messages).toBeGreaterThanOrEqual(20);
    expect(body.counts.integrations).toBe(4);
    expect(body.checks.every((check) => check.ok)).toBe(true);
  });

  it("returns a detail item by id", async () => {
    const response = await getItem(new Request("http://localhost/api/life-admin/items/msg-dentist"), {
      params: Promise.resolve({ id: "msg-dentist" }),
    });
    const body = (await response.json()) as { item: { id: string } };

    expect(response.status).toBe(200);
    expect(body.item.id).toBe("msg-dentist");
  });

  it("updates item status", async () => {
    const response = await patchItem(
      new Request("http://localhost/api/life-admin/items/msg-dentist", {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      }),
      { params: Promise.resolve({ id: "msg-dentist" }) },
    );
    const body = (await response.json()) as { item: { status: string } };

    expect(response.status).toBe(200);
    expect(body.item.status).toBe("completed");
  });

  it("rejects invalid statuses", async () => {
    const response = await patchItem(
      new Request("http://localhost/api/life-admin/items/msg-dentist", {
        method: "PATCH",
        body: JSON.stringify({ status: "blocked" }),
      }),
      { params: Promise.resolve({ id: "msg-dentist" }) },
    );

    expect(response.status).toBe(400);
  });

  it("returns generated tasks", async () => {
    const response = await getTasks();
    const body = (await response.json()) as { tasks: unknown[] };

    expect(response.status).toBe(200);
    expect(body.tasks.length).toBeGreaterThan(0);
  });

  it("performs save-document actions and exposes document records", async () => {
    const actionResponse = await postAction(
      new Request("http://localhost/api/life-admin/items/msg-tax-document/action", {
        method: "POST",
        body: JSON.stringify({ action: "save_document" }),
      }),
      { params: Promise.resolve({ id: "msg-tax-document" }) },
    );
    const documentsResponse = await getDocuments();
    const documentsBody = (await documentsResponse.json()) as { documents: Array<{ sourceMessageId: string }> };

    expect(actionResponse.status).toBe(200);
    expect(documentsBody.documents.map((document) => document.sourceMessageId)).toContain("msg-tax-document");
  });

  it("updates settings and filters disabled categories", async () => {
    const updateResponse = await patchSettings(
      new Request("http://localhost/api/life-admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ disabledCategories: ["medical"] }),
      }),
    );
    const settingsResponse = await getSettings();
    const itemsResponse = await getItems(new Request("http://localhost/api/life-admin/items"));
    const settingsBody = (await settingsResponse.json()) as { settings: { disabledCategories: string[] } };
    const itemsBody = (await itemsResponse.json()) as { items: Array<{ category: string }> };

    expect(updateResponse.status).toBe(200);
    expect(settingsBody.settings.disabledCategories).toContain("medical");
    expect(itemsBody.items.every((item) => item.category !== "medical")).toBe(true);
  });

  it("updates integration readiness state", async () => {
    const updateResponse = await patchIntegration(
      new Request("http://localhost/api/life-admin/integrations/gmail", {
        method: "PATCH",
        body: JSON.stringify({ status: "paused", notes: "Waiting for OAuth setup." }),
      }),
      { params: Promise.resolve({ provider: "gmail" }) },
    );
    const integrationsResponse = await getIntegrations();
    const integrationsBody = (await integrationsResponse.json()) as { integrations: Array<{ provider: string; status: string }> };

    expect(updateResponse.status).toBe(200);
    expect(integrationsBody.integrations.find((integration) => integration.provider === "gmail")?.status).toBe("paused");
  });

  it("returns audit events", async () => {
    await patchItem(
      new Request("http://localhost/api/life-admin/items/msg-dentist", {
        method: "PATCH",
        body: JSON.stringify({ status: "completed" }),
      }),
      { params: Promise.resolve({ id: "msg-dentist" }) },
    );

    const response = await getAudit(new Request("http://localhost/api/life-admin/audit"));
    const body = (await response.json()) as { auditLog: Array<{ type: string }> };

    expect(response.status).toBe(200);
    expect(body.auditLog.some((event) => event.type === "status_updated")).toBe(true);
  });

  it("creates and reviews approval requests", async () => {
    const createResponse = await postApproval(
      new Request("http://localhost/api/life-admin/approvals", {
        method: "POST",
        body: JSON.stringify({
          actionType: "cancel_subscription",
          title: "Cancel CloudNest trial",
          description: "Requires explicit approval before cancellation.",
          sourceMessageId: "msg-free-trial",
        }),
      }),
    );
    const createBody = (await createResponse.json()) as { approval: { id: string; status: string; riskLevel: string } };
    const reviewResponse = await patchApproval(
      new Request(`http://localhost/api/life-admin/approvals/${createBody.approval.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "rejected", reviewerNote: "Keep it for one more month." }),
      }),
      { params: Promise.resolve({ id: createBody.approval.id }) },
    );
    const approvalsResponse = await getApprovals();
    const approvalsBody = (await approvalsResponse.json()) as { approvals: Array<{ id: string; status: string }> };

    expect(createResponse.status).toBe(200);
    expect(createBody.approval.status).toBe("pending");
    expect(createBody.approval.riskLevel).toBe("high");
    expect(reviewResponse.status).toBe(200);
    expect(approvalsBody.approvals.find((approval) => approval.id === createBody.approval.id)?.status).toBe("rejected");
  });

  it("ingests raw messages and records ingestion runs", async () => {
    const ingestResponse = await postIngest(
      new Request("http://localhost/api/life-admin/ingest", {
        method: "POST",
        body: JSON.stringify({
          provider: "gmail",
          messages: [
            {
              id: "raw-tax-form",
              source: "Gmail",
              sender: "BrightPath Brokerage",
              subject: "Tax document available May 9",
              body: "Your corrected 1099 tax document is available May 9.",
              receivedAt: "2026-05-05T10:00:00-05:00",
            },
          ],
        }),
      }),
    );
    const ingestBody = (await ingestResponse.json()) as { items: Array<{ id: string; category: string }> };
    const runsResponse = await getIngestRuns();
    const runsBody = (await runsResponse.json()) as { runs: Array<{ createdItemIds: string[] }> };

    expect(ingestResponse.status).toBe(200);
    expect(ingestBody.items[0]).toMatchObject({ id: "msg-raw-tax-form", category: "tax/document" });
    expect(runsBody.runs[0]?.createdItemIds).toContain("msg-raw-tax-form");
  });

  it("returns recommendations and accepts them", async () => {
    const recommendationsResponse = await getRecommendations();
    const recommendationsBody = (await recommendationsResponse.json()) as {
      recommendations: Array<{ id: string; actionType: string }>;
    };
    const approvalRecommendation = recommendationsBody.recommendations.find((recommendation) => recommendation.actionType === "create_approval");

    expect(recommendationsResponse.status).toBe(200);
    expect(approvalRecommendation).toBeTruthy();

    const acceptResponse = await acceptRecommendation(new Request("http://localhost/api/life-admin/recommendations/x/accept", { method: "POST" }), {
      params: Promise.resolve({ id: approvalRecommendation?.id ?? "" }),
    });
    const acceptBody = (await acceptResponse.json()) as { approval?: { status: string } };

    expect(acceptResponse.status).toBe(200);
    expect(acceptBody.approval?.status).toBe("pending");
  });
});

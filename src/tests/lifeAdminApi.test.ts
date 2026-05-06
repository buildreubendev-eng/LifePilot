import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as getAudit } from "@/app/api/life-admin/audit/route";
import { GET as getDocuments } from "@/app/api/life-admin/documents/route";
import { GET as getIntegrations } from "@/app/api/life-admin/integrations/route";
import { PATCH as patchIntegration } from "@/app/api/life-admin/integrations/[provider]/route";
import { POST as postAction } from "@/app/api/life-admin/items/[id]/action/route";
import { GET as getItems } from "@/app/api/life-admin/items/route";
import { GET as getItem, PATCH as patchItem } from "@/app/api/life-admin/items/[id]/route";
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
});

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET as getItems } from "@/app/api/life-admin/items/route";
import { GET as getItem, PATCH as patchItem } from "@/app/api/life-admin/items/[id]/route";
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
    const response = await getItems();
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
});

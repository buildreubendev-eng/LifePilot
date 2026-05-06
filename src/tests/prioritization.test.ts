import { describe, expect, it } from "vitest";
import { mockMessages } from "@/data/mockMessages";
import { calculateLifeAdminScore, generateTasks, scoreLifeAdminItem } from "@/lib/prioritization";

const now = new Date("2026-05-06T09:00:00-05:00");

describe("prioritization engine", () => {
  it("ranks overdue and high-confidence financial items near the top", () => {
    const tasks = generateTasks(mockMessages, now);

    expect(["msg-fraud-alert", "msg-medical-bill"]).toContain(tasks[0]?.messageId);
    expect(tasks.slice(0, 3).map((task) => task.messageId)).toContain("msg-fraud-alert");
    expect(tasks.slice(0, 5).map((task) => task.messageId)).toContain("msg-medical-bill");
    expect(tasks[0]?.score).toBeGreaterThan(tasks.at(-1)?.score ?? 0);
  });

  it("adds an overdue boost when due date is in the past", () => {
    const item = { ...mockMessages[0], dueDate: "2026-05-01" };
    const task = scoreLifeAdminItem(item, now);

    expect(task.scoreBreakdown.overdue).toBe(25);
    expect(task.score).toBeGreaterThan(80);
  });

  it("lowers the PLOS life admin score when active urgent items remain", () => {
    const score = calculateLifeAdminScore(mockMessages, now);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThan(100);
  });
});

import type { BriefingSummary, LifeAdminCategory, LifeAdminMessage, LifeAdminTask } from "@/lib/types";

const categoryImportance: Record<LifeAdminCategory, number> = {
  bill: 20,
  renewal: 14,
  appointment: 16,
  travel: 17,
  medical: 22,
  insurance: 21,
  subscription: 12,
  receipt: 6,
  "school/family": 20,
  "tax/document": 15,
  "personal reply": 10,
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysUntil(dueDate: string | undefined, now = new Date()): number | undefined {
  if (!dueDate) {
    return undefined;
  }

  const due = startOfDay(new Date(`${dueDate}T12:00:00`));
  const today = startOfDay(now);
  return Math.round((due.getTime() - today.getTime()) / 86_400_000);
}

export function scoreLifeAdminItem(item: LifeAdminMessage, now = new Date()): LifeAdminTask {
  const distance = daysUntil(item.dueDate, now);
  const overdue = distance !== undefined && distance < 0 ? 25 : 0;
  const dueDate =
    distance === undefined
      ? 0
      : distance < 0
        ? 28
        : Math.max(0, 28 - Math.min(distance, 14) * 2);
  const financialImpact = Math.min(18, Math.log10((item.financialImpact ?? 0) + 1) * 5);
  const confidence = item.confidence * 12;
  const category = categoryImportance[item.category];
  const score = Math.round(Math.min(100, overdue + dueDate + financialImpact + confidence + category));

  return {
    id: `task-${item.id}`,
    messageId: item.id,
    title: toTaskTitle(item),
    category: item.category,
    dueDate: item.dueDate,
    priority: item.priority,
    status: item.status,
    suggestedAction: item.suggestedAction,
    score,
    scoreBreakdown: {
      dueDate: Math.round(dueDate),
      category,
      financialImpact: Math.round(financialImpact),
      confidence: Math.round(confidence),
      overdue,
    },
    source: item.source,
  };
}

export function generateTasks(items: LifeAdminMessage[], now = new Date()): LifeAdminTask[] {
  return items
    .filter((item) => item.status !== "ignored")
    .map((item) => scoreLifeAdminItem(item, now))
    .sort((a, b) => b.score - a.score);
}

export function calculateLifeAdminScore(items: LifeAdminMessage[], now = new Date()): number {
  const activeItems = items.filter((item) => item.status !== "completed" && item.status !== "ignored");
  const penalty = activeItems.reduce((total, item) => {
    const distance = daysUntil(item.dueDate, now);
    const overduePenalty = distance !== undefined && distance < 0 ? 10 : 0;
    const urgentPenalty = item.priority === "urgent" ? 4 : item.priority === "high" ? 3 : 1;
    const nearPenalty = distance !== undefined && distance <= 3 ? 5 : distance !== undefined && distance <= 7 ? 3 : 0;
    return total + overduePenalty + urgentPenalty + nearPenalty;
  }, 0);

  return Math.max(0, Math.min(100, 100 - penalty));
}

export function createWeeklyBriefing(items: LifeAdminMessage[], now = new Date()): BriefingSummary {
  const tasks = generateTasks(items, now).filter((task) => task.status !== "completed");
  const attentionThisWeek = tasks.filter((task) => {
    const distance = daysUntil(task.dueDate, now);
    return distance !== undefined && distance <= 7;
  });
  const overdueItems = tasks.filter((task) => {
    const distance = daysUntil(task.dueDate, now);
    return distance !== undefined && distance < 0;
  });
  const upcomingBills = tasks.filter((task) => ["bill", "insurance", "renewal"].includes(task.category));
  const renewingSubscriptions = tasks.filter((task) => task.category === "subscription");
  const documentsToSave = items.filter((item) => item.documentSaveRecommended && item.status !== "completed");
  const scheduleConflicts = findScheduleConflicts(items);

  return {
    attentionThisWeek,
    overdueItems,
    upcomingBills,
    scheduleConflicts,
    renewingSubscriptions,
    documentsToSave,
    recommendedActions: [
      attentionThisWeek[0]?.suggestedAction,
      overdueItems[0] ? `Clear overdue item: ${overdueItems[0].title}.` : undefined,
      renewingSubscriptions[0]?.suggestedAction,
      documentsToSave[0] ? `Save ${documentsToSave[0].title.toLowerCase()} to your records.` : undefined,
    ].filter(Boolean) as string[],
  };
}

export function findScheduleConflicts(items: LifeAdminMessage[]): LifeAdminMessage[][] {
  const appointments = items
    .filter((item) => item.appointmentStart && item.status !== "ignored")
    .sort((a, b) => new Date(a.appointmentStart ?? "").getTime() - new Date(b.appointmentStart ?? "").getTime());
  const conflicts: LifeAdminMessage[][] = [];

  for (let index = 0; index < appointments.length - 1; index += 1) {
    const current = appointments[index];
    const next = appointments[index + 1];
    const currentTime = new Date(current.appointmentStart ?? "").getTime();
    const nextTime = new Date(next.appointmentStart ?? "").getTime();

    if (Math.abs(nextTime - currentTime) < 60 * 60 * 1000) {
      conflicts.push([current, next]);
    }
  }

  return conflicts;
}

function toTaskTitle(item: LifeAdminMessage): string {
  const map: Partial<Record<LifeAdminCategory, string>> = {
    bill: `Pay or review ${item.title.toLowerCase()}`,
    insurance: `Review ${item.title.toLowerCase()}`,
    renewal: `Decide on ${item.title.toLowerCase()}`,
    subscription: `Check ${item.title.toLowerCase()}`,
    "personal reply": `Reply about ${item.title.toLowerCase()}`,
  };

  return map[item.category] ?? item.title;
}

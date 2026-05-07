"use client";

import { ItemCard } from "@/components/ItemCard";
import { Section } from "@/components/Section";
import { ConflictAlert } from "@/components/ConflictAlert";
import { createWeeklyBriefing } from "@/lib/prioritization";
import { usePlosStore } from "@/lib/usePlosStore";

export function WeeklyBriefingView() {
  const { items } = usePlosStore();
  const briefing = createWeeklyBriefing(items);

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Weekly Briefing</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          A calm summary of what needs attention, what can wait, and where PLOS recommends action.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {briefing.recommendedActions.map((action) => (
          <div key={action} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-stone-950">{action}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Needs Attention This Week">
          <div className="grid gap-3">
            {briefing.attentionThisWeek.slice(0, 6).map((task) => (
              <ItemCard key={task.id} task={task} />
            ))}
          </div>
        </Section>
        <Section title="Overdue Items">
          <div className="grid gap-3">
            {briefing.overdueItems.length === 0 ? (
              <div className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600">No overdue items in the current mock set.</div>
            ) : (
              briefing.overdueItems.map((task) => <ItemCard key={task.id} task={task} />)
            )}
          </div>
        </Section>
        <Section title="Upcoming Bills">
          <div className="grid gap-3">
            {briefing.upcomingBills.slice(0, 5).map((task) => (
              <ItemCard key={task.id} task={task} />
            ))}
          </div>
        </Section>
        <Section title="Subscriptions Renewing Soon">
          <div className="grid gap-3">
            {briefing.renewingSubscriptions.map((task) => (
              <ItemCard key={task.id} task={task} />
            ))}
          </div>
        </Section>
      </div>

      <Section title="Schedule Conflicts">
        {briefing.scheduleConflicts.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600">Your schedule is clear of conflicts.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {briefing.scheduleConflicts.map((conflict) => (
              <ConflictAlert key={conflict.map((item) => item.id).join("-")} conflict={conflict} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Documents That Should Be Saved">
        <div className="grid gap-3 lg:grid-cols-2">
          {briefing.documentsToSave.slice(0, 6).map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </Section>
    </div>
  );
}

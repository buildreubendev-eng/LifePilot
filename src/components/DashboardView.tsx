"use client";

import { ItemCard } from "@/components/ItemCard";
import { MetricCard } from "@/components/MetricCard";
import { PrivacyPanel } from "@/components/PrivacyPanel";
import { Section } from "@/components/Section";
import { usePlosStore } from "@/lib/usePlosStore";
import { calculateLifeAdminScore, daysUntil, generateTasks } from "@/lib/prioritization";

export function DashboardView() {
  const { items } = usePlosStore();
  const tasks = generateTasks(items);
  const score = calculateLifeAdminScore(items);
  const activeItems = items.filter((item) => item.status !== "completed" && item.status !== "ignored");
  const overdue = activeItems.filter((item) => {
    const distance = daysUntil(item.dueDate);
    return distance !== undefined && distance < 0;
  });
  const dueSoon = activeItems.filter((item) => {
    const distance = daysUntil(item.dueDate);
    return distance !== undefined && distance >= 0 && distance <= 7;
  });

  return (
    <div>
      <section className="grid gap-6 py-4 lg:grid-cols-[1.35fr_0.65fr] lg:items-stretch">
        <div className="rounded-lg bg-stone-900 p-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Personal command center</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Reuben&apos;s personal life operating system, starting with today&apos;s life admin.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-200">
            PLOS turns mock emails, calendar events, bills, renewals, receipts, and reminders into a focused action plan for the first MVP slice.
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Life Admin Score</p>
          <div className="mt-5 flex items-end gap-3">
            <span className="text-6xl font-black text-stone-950">{score}</span>
            <span className="pb-2 text-lg font-bold text-stone-500">/100</span>
          </div>
          <div className="mt-5 h-3 rounded-full bg-stone-100">
            <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${score}%` }} />
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-600">Lower score means more overdue, urgent, or near-term items need attention.</p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Priority actions" value={tasks.slice(0, 8).length} detail="Highest scoring tasks ready now" />
        <MetricCard label="Due this week" value={dueSoon.length} detail="Deadlines, appointments, and replies" />
        <MetricCard label="Overdue" value={overdue.length} detail="Needs immediate review" />
        <MetricCard label="Documents" value={items.filter((item) => item.documentSaveRecommended).length} detail="Receipts, forms, and confirmations" />
      </div>

      <Section title="Today&apos;s Priority Actions">
        <div className="grid gap-3 lg:grid-cols-2">
          {tasks.slice(0, 6).map((task) => (
            <ItemCard key={task.id} task={task} />
          ))}
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Bills And Renewals">
          <div className="grid gap-3">
            {tasks
              .filter((task) => ["bill", "renewal", "insurance"].includes(task.category))
              .slice(0, 4)
              .map((task) => (
                <ItemCard key={task.id} task={task} />
              ))}
          </div>
        </Section>
        <Section title="Appointments And Travel">
          <div className="grid gap-3">
            {tasks
              .filter((task) => ["appointment", "travel", "medical"].includes(task.category))
              .slice(0, 4)
              .map((task) => (
                <ItemCard key={task.id} task={task} />
              ))}
          </div>
        </Section>
        <Section title="Documents To Save">
          <div className="grid gap-3">
            {items
              .filter((item) => item.documentSaveRecommended)
              .slice(0, 4)
              .map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
          </div>
        </Section>
        <Section title="Messages Needing Reply">
          <div className="grid gap-3">
            {items
              .filter((item) => item.needsReply)
              .map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
          </div>
        </Section>
      </div>

      <Section title="Subscription Warnings">
        <div className="grid gap-3 md:grid-cols-2">
          {tasks
            .filter((task) => task.category === "subscription")
            .map((task) => (
              <ItemCard key={task.id} task={task} />
            ))}
        </div>
      </Section>

      <PrivacyPanel />
    </div>
  );
}

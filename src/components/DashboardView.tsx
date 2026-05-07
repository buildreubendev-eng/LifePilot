"use client";

import { useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { MetricCard } from "@/components/MetricCard";
import { PrivacyPanel } from "@/components/PrivacyPanel";
import { Section } from "@/components/Section";
import { EmptyState } from "@/components/EmptyState";
import { fetchJson } from "@/lib/apiClient";
import type { ActionRecommendation, DashboardSummary, LifeAdminTask } from "@/lib/types";
import { usePlosStore } from "@/lib/usePlosStore";

export function DashboardView() {
  const { items, isLoading: itemsLoading } = usePlosStore();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [recommendationCount, setRecommendationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const [dashboardBody, recsBody] = await Promise.all([
          fetchJson<{ dashboard: DashboardSummary }>("/api/life-admin/dashboard"),
          fetchJson<{ recommendations: ActionRecommendation[] }>("/api/life-admin/recommendations"),
        ]);

        if (active) {
          setDashboard(dashboardBody.dashboard);
          setRecommendationCount(recsBody.recommendations.length);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const score = dashboard?.lifeAdminScore ?? 0;
  const tasks = dashboard?.priorityTasks ?? [];
  const counts = dashboard?.counts ?? {
    active: 0,
    overdue: 0,
    dueThisWeek: 0,
    documentsToSave: 0,
    messagesNeedingReply: 0,
    subscriptionWarnings: 0,
    manualTasks: 0,
  };

  if (isLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {error ? (
        <div className="mb-4 rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{error}</div>
      ) : null}

      <section className="grid gap-6 py-4 lg:grid-cols-[1.35fr_0.65fr] lg:items-stretch">
        <div className="rounded-lg bg-stone-900 p-6 text-white">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">Personal command center</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Reuben&apos;s Personal Life Operating System, starting with today&apos;s life admin.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-200">
            PLOS turns emails, calendar events, bills, renewals, receipts, and reminders into a focused action plan.
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">Life Admin Score</p>
          <div className="mt-5 flex items-end gap-3">
            <span className="text-6xl font-black text-stone-950">{score}</span>
            <span className="pb-2 text-lg font-bold text-stone-500">/100</span>
          </div>
          <div className="mt-5 h-3 rounded-full bg-stone-100">
            <div className="h-3 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${score}%` }} />
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-600">Lower score means more overdue, urgent, or near-term items need attention.</p>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard label="Priority actions" value={tasks.length} detail="Highest scoring tasks ready now" />
        <MetricCard label="Due this week" value={counts.dueThisWeek} detail="Deadlines, appointments, and replies" />
        <MetricCard label="Overdue" value={counts.overdue} detail="Needs immediate review" />
        <MetricCard label="Documents" value={counts.documentsToSave} detail="Receipts, forms, and confirmations" />
        <MetricCard label="Suggestions" value={recommendationCount} detail="Safe next moves from PLOS" />
      </div>

      <Section title="Today&apos;s Priority Actions">
        {tasks.length === 0 ? (
          <EmptyState title="All clear" copy="No priority actions right now." />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {tasks.slice(0, 6).map((task) => (
              <ItemCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </Section>

      <DashboardCategorySection title="Bills And Renewals" tasks={tasks} categories={["bill", "renewal", "insurance"]} />
      <DashboardCategorySection title="Appointments And Travel" tasks={tasks} categories={["appointment", "travel", "medical"]} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Documents To Save">
          {counts.documentsToSave === 0 ? (
            <EmptyState title="No documents pending" copy="Documents will appear when items recommend saving." />
          ) : (
            <div className="grid gap-3">
              {items
                .filter((item) => item.documentSaveRecommended && !item.documentSavedAt)
                .slice(0, 4)
                .map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
            </div>
          )}
        </Section>
        <Section title="Messages Needing Reply">
          {counts.messagesNeedingReply === 0 ? (
            <EmptyState title="No replies needed" copy="No pending messages require a response." />
          ) : (
            <div className="grid gap-3">
              {items
                .filter((item) => item.needsReply)
                .map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="Subscription Warnings">
        {counts.subscriptionWarnings === 0 ? (
          <EmptyState title="No subscription warnings" copy="All subscriptions look fine." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {tasks
              .filter((task) => task.category === "subscription")
              .map((task) => (
                <ItemCard key={task.id} task={task} />
              ))}
          </div>
        )}
      </Section>

      <PrivacyPanel />
    </div>
  );
}

function DashboardCategorySection({
  title,
  tasks,
  categories,
}: {
  title: string;
  tasks: LifeAdminTask[];
  categories: string[];
}) {
  const filtered = tasks.filter((task) => categories.includes(task.category)).slice(0, 4);

  if (filtered.length === 0) {
    return null;
  }

  return (
    <Section title={title}>
      <div className="grid gap-3 lg:grid-cols-2">
        {filtered.map((task) => (
          <ItemCard key={task.id} task={task} />
        ))}
      </div>
    </Section>
  );
}

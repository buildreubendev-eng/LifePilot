"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ItemCard } from "@/components/ItemCard";
import { MetricCard } from "@/components/MetricCard";
import { PrivacyPanel } from "@/components/PrivacyPanel";
import { ScoreGauge } from "@/components/ScoreGauge";
import { Section } from "@/components/Section";
import { EmptyState } from "@/components/EmptyState";
import { fetchJson } from "@/lib/apiClient";
import type { ActionRecommendation, DashboardSummary, LifeAdminTask } from "@/lib/types";
import { usePlosStore } from "@/lib/usePlosStore";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

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
    <div className="animate-fade-in">
      {error ? (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-800">{error}</div>
      ) : null}

      {/* Hero: Greeting + Score */}
      <section className="grid gap-6 py-4 lg:grid-cols-[1.4fr_0.6fr] lg:items-stretch">
        <div className="rounded-2xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-8 text-white shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
            Personal command center
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
            {getGreeting()}, Reuben.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-stone-300">
            {counts.overdue > 0
              ? `You have ${counts.overdue} overdue item${counts.overdue > 1 ? "s" : ""} and ${counts.dueThisWeek} due this week. Let\u2019s triage.`
              : counts.dueThisWeek > 0
                ? `${counts.dueThisWeek} item${counts.dueThisWeek > 1 ? "s" : ""} due this week. You\u2019re in good shape.`
                : "Your life admin is all caught up. Nice work."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/inbox"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-stone-900 transition hover:bg-emerald-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-6l-2 3H10l-2-3H2" />
                <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              </svg>
              Quick Triage
            </Link>
            <Link
              href="/briefing"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              View Briefing
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-3">
            Life Admin Score
          </p>
          <ScoreGauge score={score} size={140} />
          <p className="mt-3 text-center text-xs leading-5 text-stone-500 max-w-[200px]">
            Lower score means more items need your attention.
          </p>
        </div>
      </section>

      {/* Metric strip */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 stagger-children">
        <MetricCard
          label="Priority"
          value={tasks.length}
          detail="Highest scoring tasks"
          accent={tasks.length > 5 ? "warning" : "default"}
        />
        <MetricCard
          label="This Week"
          value={counts.dueThisWeek}
          detail="Upcoming deadlines"
          accent={counts.dueThisWeek > 3 ? "warning" : "default"}
        />
        <MetricCard
          label="Overdue"
          value={counts.overdue}
          detail="Needs immediate review"
          accent={counts.overdue > 0 ? "danger" : "success"}
        />
        <MetricCard
          label="Documents"
          value={counts.documentsToSave}
          detail="To save"
        />
        <MetricCard
          label="Suggestions"
          value={recommendationCount}
          detail="Safe next moves"
          accent={recommendationCount > 0 ? "success" : "default"}
        />
      </div>

      {/* Priority actions */}
      <Section title="Today&apos;s Priority Actions">
        {tasks.length === 0 ? (
          <EmptyState
            title="All clear"
            copy="No priority actions right now. Enjoy your day."
            icon="success"
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 stagger-children">
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
            <EmptyState
              title="No documents pending"
              copy="Documents will appear when items recommend saving."
              icon="documents"
            />
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
            <EmptyState
              title="No replies needed"
              copy="No pending messages require a response."
              icon="inbox"
            />
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
          <EmptyState
            title="No subscription warnings"
            copy="All subscriptions look fine."
            icon="success"
          />
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

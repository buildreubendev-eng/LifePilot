"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ItemCard } from "@/components/ItemCard";
import { PrivacyPanel } from "@/components/PrivacyPanel";
import { Section } from "@/components/Section";
import { EmptyState } from "@/components/EmptyState";
import { fetchJson } from "@/lib/apiClient";
import type { ActionRecommendation, DashboardSummary, LifeAdminTask } from "@/lib/types";
import { usePlosStore } from "@/lib/usePlosStore";
import { RingProgress, Group, Text, Stack, Paper, Center } from '@mantine/core';
import { AreaChart } from '@mantine/charts';
import { ChevronRight, TrendingUp, AlertCircle, CheckCircle2, RefreshCw, Clock, Inbox, FileText } from 'lucide-react';
import { DashboardSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// Generate mock trend data for the area chart
const mockTrendData = Array.from({ length: 7 }).map((_, i) => ({
  date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
  score: Math.floor(75 + Math.random() * 20),
}));

export function DashboardView() {
  const { items, isLoading: itemsLoading, isRefreshing, refreshItems, resetStatuses } = usePlosStore();
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [recommendationCount, setRecommendationCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDashboardRefreshing, setIsDashboardRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const loadDashboard = useCallback(async (showRefreshing = true) => {
    if (showRefreshing) {
      setIsDashboardRefreshing(true);
    }

    try {
      const [dashboardBody, recsBody] = await Promise.all([
        fetchJson<{ dashboard: DashboardSummary }>("/api/life-admin/dashboard"),
        fetchJson<{ recommendations: ActionRecommendation[] }>("/api/life-admin/recommendations"),
      ]);

      setDashboard(dashboardBody.dashboard);
      setRecommendationCount(recsBody.recommendations.length);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
    } finally {
      setIsLoading(false);
      if (showRefreshing) {
        setIsDashboardRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialDashboard() {
      try {
        const [dashboardBody, recsBody] = await Promise.all([
          fetchJson<{ dashboard: DashboardSummary }>("/api/life-admin/dashboard"),
          fetchJson<{ recommendations: ActionRecommendation[] }>("/api/life-admin/recommendations"),
        ]);

        if (active) {
          setDashboard(dashboardBody.dashboard);
          setRecommendationCount(recsBody.recommendations.length);
          // Set last trend point to current score
          mockTrendData[mockTrendData.length - 1].score = dashboardBody.dashboard.lifeAdminScore;
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

    void loadInitialDashboard();

    return () => {
      active = false;
    };
  }, []);

  async function refreshDashboard() {
    await Promise.all([loadDashboard(), refreshItems()]);
    addToast("Dashboard refreshed.", "success");
  }

  async function resetDemoData() {
    const ok = await resetStatuses();
    await Promise.all([loadDashboard(), refreshItems()]);
    addToast(ok ? "Demo data reset." : "Reset attempted. Check the error message above.", ok ? "success" : "warning");
  }

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
    return <DashboardSkeleton />;
  }

  return (
    <div className="animate-fade-in pb-20">
      {error ? (
        <div className="mb-6 rounded-lg bg-red-950/50 border border-red-500/30 px-4 py-3 text-sm font-medium text-red-200">{error}</div>
      ) : null}

      {/* Hero Section: Executive Dashboard */}
      <section className="grid gap-6 mb-8 xl:grid-cols-[1fr_380px] items-stretch animate-slide-up" style={{ animationDelay: '0ms' }}>
        
        {/* Main Executive Summary */}
        <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-black/40 p-8 shadow-2xl backdrop-blur-xl flex flex-col justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
                System Active
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void refreshDashboard()}
                disabled={isDashboardRefreshing || isRefreshing}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50"
              >
                <RefreshCw size={14} className={isDashboardRefreshing || isRefreshing ? "animate-spin" : ""} />
                {isDashboardRefreshing || isRefreshing ? "Syncing..." : "Sync Systems"}
              </button>
            </div>
          </div>
          
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl mb-4">
              {getGreeting()}, Reuben.
            </h1>
            <p className="max-w-xl text-lg text-stone-400 font-light leading-relaxed">
              {counts.overdue > 0
                ? `You have ${counts.overdue} overdue items and ${counts.dueThisWeek} critical items due this week. Action is recommended.`
                : counts.dueThisWeek > 0
                  ? `${counts.dueThisWeek} upcoming items require your attention this week. All systems normal.`
                  : "All administrative queues are clear. Operating at optimal efficiency."}
            </p>
          </div>
          
          <div className="relative z-10 mt-10 flex flex-wrap gap-4">
            <Link
              href="/inbox"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 hover:-translate-y-0.5"
            >
              <Inbox size={16} />
              Review Inbox
            </Link>
            <Link
              href="/briefing"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white/10 hover:-translate-y-0.5"
            >
              <FileText size={16} />
              Executive Briefing
            </Link>
          </div>
        </div>

        {/* Score & Trend Panel */}
        <div className="flex flex-col rounded-3xl border border-white/5 bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={2}>Admin Efficiency</Text>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          
          <Center className="flex-1 my-4">
            <RingProgress
              size={180}
              thickness={12}
              roundCaps
              sections={[{ value: score, color: score > 80 ? 'teal.5' : score > 60 ? 'yellow.5' : 'red.5' }]}
              label={
                <div className="flex flex-col items-center">
                  <Text fw={900} fz={42} className="text-white tracking-tight leading-none">{score}</Text>
                  <Text fz="xs" c="dimmed" fw={600} tt="uppercase" lts={1} className="mt-1">Score</Text>
                </div>
              }
            />
          </Center>
          
          <div className="mt-auto pt-4 border-t border-white/5">
            <Text size="xs" fw={600} c="dimmed" mb={8}>7-DAY TREND</Text>
            <div className="h-[60px]">
              <AreaChart
                h={60}
                data={mockTrendData}
                dataKey="date"
                series={[{ name: 'score', color: 'teal.6' }]}
                curveType="monotone"
                withDots={false}
                withXAxis={false}
                withYAxis={false}
                gridAxis="none"
                withTooltip={false}
                fillOpacity={0.2}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5 mb-10 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <MetricCard label="Priority Actions" value={tasks.length} icon={<AlertCircle size={20} />} trend="warning" />
        <MetricCard label="Due This Week" value={counts.dueThisWeek} icon={<Clock size={20} />} />
        <MetricCard label="Overdue" value={counts.overdue} icon={<AlertCircle size={20} />} trend={counts.overdue > 0 ? "danger" : "success"} />
        <MetricCard label="Docs To Save" value={counts.documentsToSave} icon={<FileText size={20} />} />
        <MetricCard label="Suggestions" value={recommendationCount} icon={<CheckCircle2 size={20} />} trend="success" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-8">
          {/* Priority actions */}
          <Section title="High-Priority Actions" action={<Link href="/tasks" className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 uppercase tracking-wider flex items-center gap-1">View All <ChevronRight size={14}/></Link>}>
            {tasks.length === 0 ? (
              <EmptyState title="All clear" copy="No priority actions right now. Operations normal." icon="success" />
            ) : (
              <div className="grid gap-4 stagger-children">
                {tasks.slice(0, 5).map((task) => (
                  <ItemCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </Section>

          <DashboardCategorySection title="Financial & Renewals" tasks={tasks} categories={["bill", "renewal", "insurance"]} />
          <DashboardCategorySection title="Logistics & Travel" tasks={tasks} categories={["appointment", "travel", "medical"]} />
        </div>

        <div className="flex flex-col gap-8">
          <Section title="Document Queue">
            {counts.documentsToSave === 0 ? (
              <EmptyState title="No pending documents" copy="The document queue is empty." icon="documents" />
            ) : (
              <div className="flex flex-col gap-3">
                {items.filter((item) => item.documentSaveRecommended && !item.documentSavedAt).slice(0, 4).map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </Section>

          <Section title="Required Communications">
            {counts.messagesNeedingReply === 0 ? (
              <EmptyState title="No replies needed" copy="All communications are up to date." icon="inbox" />
            ) : (
              <div className="flex flex-col gap-3">
                {items.filter((item) => item.needsReply).slice(0, 4).map((item) => (
                  <ItemCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </Section>
          
          <Section title="System Warnings">
            {counts.subscriptionWarnings === 0 ? (
              <EmptyState title="Systems Optimal" copy="No subscription or system warnings." icon="success" />
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.filter((task) => task.category === "subscription").map((task) => (
                  <ItemCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-white/5">
        <PrivacyPanel />
      </div>
    </div>
  );
}

// Executive Metric Card Component
function MetricCard({ label, value, icon, trend }: { label: string, value: number, icon: React.ReactNode, trend?: 'success'|'warning'|'danger'|'neutral' }) {
  const getColors = () => {
    switch (trend) {
      case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'danger': return 'text-red-400 bg-red-500/10 border-red-500/20';
      default: return 'text-stone-400 bg-white/5 border-white/5';
    }
  };
  
  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-md transition-all hover:bg-white/10 ${getColors()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-black/30">
          {icon}
        </div>
      </div>
      <div className="mt-auto">
        <Text fz={32} fw={800} className="text-white leading-none mb-1 tabular-nums">{value}</Text>
        <Text fz="xs" fw={600} tt="uppercase" lts={1} className="opacity-80">{label}</Text>
      </div>
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
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((task) => (
          <ItemCard key={task.id} task={task} />
        ))}
      </div>
    </Section>
  );
}

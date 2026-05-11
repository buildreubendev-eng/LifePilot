"use client";

import { useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { Section } from "@/components/Section";
import { ConflictAlert } from "@/components/ConflictAlert";
import { EmptyState } from "@/components/EmptyState";
import { fetchJson } from "@/lib/apiClient";
import type { BriefingSummary } from "@/lib/types";
import {
  FileText,
  AlertTriangle,
  Calendar,
  DollarSign,
  RefreshCw,
  CheckCircle2,
  Clock,
  Shield,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { GenericSkeleton } from "@/components/Skeleton";

export function WeeklyBriefingView() {
  const [briefing, setBriefing] = useState<BriefingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadBriefing() {
      try {
        const body = await fetchJson<{ briefing: BriefingSummary }>("/api/life-admin/briefing");
        if (active) { setBriefing(body.briefing); setError(null); }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load briefing");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadBriefing();
    return () => { active = false; };
  }, []);

  if (isLoading) {
    return <GenericSkeleton />;
  }

  if (error) {
    return (
      <div className="animate-fade-in pb-20">
        <section className="py-4 mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Executive Briefing</h1>
        </section>
        <div className="rounded-lg bg-red-950/50 border border-red-500/30 px-4 py-3 text-sm font-medium text-red-200">{error}</div>
      </div>
    );
  }

  if (!briefing) return null;

  const totalAttention = briefing.attentionThisWeek.length + briefing.overdueItems.length;
  const totalFinancial = briefing.upcomingBills.length + briefing.renewingSubscriptions.length;

  return (
    <div className="animate-fade-in pb-20">
      {/* Hero */}
      <section className="py-4 mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Executive Briefing</h1>
            <p className="mt-3 max-w-3xl text-lg font-light leading-7 text-stone-400">
              A calm summary of what needs attention, what can wait, and where PLOS recommends action.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-stone-400">
            <Calendar size={14} />
            {new Date().toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
      </section>

      {/* Quick Stats Strip */}
      <div className="mb-10 grid gap-4 grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Attention</span>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{totalAttention}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-red-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Overdue</span>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{briefing.overdueItems.length}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Financial</span>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{totalFinancial}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={14} className="text-violet-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Conflicts</span>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{briefing.scheduleConflicts.length}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-4 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} className="text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Documents</span>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{briefing.documentsToSave.length}</p>
        </div>
      </div>

      {/* Recommended Actions Banner */}
      {briefing.recommendedActions.length > 0 && (
        <div className="mb-10 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-emerald-300 uppercase tracking-widest">Recommended Actions</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {briefing.recommendedActions.map((action) => (
              <div key={action} className="flex items-start gap-2 rounded-xl border border-emerald-500/10 bg-black/20 p-3">
                <TrendingUp size={12} className="shrink-0 mt-0.5 text-emerald-400" />
                <p className="text-sm font-medium text-stone-300">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <Section title="Needs Attention This Week" icon={<AlertTriangle size={16} className="text-amber-400" />}>
          <div className="grid gap-3">
            {briefing.attentionThisWeek.length === 0 ? (
              <EmptyState title="Nothing urgent" copy="Your week looks manageable." icon="success" />
            ) : (
              briefing.attentionThisWeek.slice(0, 6).map((task) => (
                <ItemCard key={task.id} task={task} />
              ))
            )}
          </div>
        </Section>

        <Section title="Overdue Items" icon={<Clock size={16} className="text-red-400" />}>
          <div className="grid gap-3">
            {briefing.overdueItems.length === 0 ? (
              <EmptyState title="Nothing overdue" copy="No overdue items right now." icon="success" />
            ) : (
              briefing.overdueItems.map((task) => <ItemCard key={task.id} task={task} />)
            )}
          </div>
        </Section>

        <Section title="Upcoming Bills" icon={<DollarSign size={16} className="text-emerald-400" />}>
          <div className="grid gap-3">
            {briefing.upcomingBills.length === 0 ? (
              <EmptyState title="No upcoming bills" copy="No bills due soon." icon="success" />
            ) : (
              briefing.upcomingBills.slice(0, 5).map((task) => (
                <ItemCard key={task.id} task={task} />
              ))
            )}
          </div>
        </Section>

        <Section title="Subscriptions Renewing" icon={<RefreshCw size={16} className="text-violet-400" />}>
          <div className="grid gap-3">
            {briefing.renewingSubscriptions.length === 0 ? (
              <EmptyState title="No renewals" copy="No subscriptions are renewing soon." icon="success" />
            ) : (
              briefing.renewingSubscriptions.map((task) => (
                <ItemCard key={task.id} task={task} />
              ))
            )}
          </div>
        </Section>
      </div>

      <Section title="Schedule Conflicts" icon={<Calendar size={16} className="text-blue-400" />}>
        {briefing.scheduleConflicts.length === 0 ? (
          <EmptyState title="Schedule clear" copy="Your schedule is clear of conflicts." icon="success" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {briefing.scheduleConflicts.map((conflict) => (
              <ConflictAlert key={conflict.map((item) => item.id).join("-")} conflict={conflict} />
            ))}
          </div>
        )}
      </Section>

      <Section title="Documents To Save" icon={<FileText size={16} className="text-blue-400" />}>
        {briefing.documentsToSave.length === 0 ? (
          <EmptyState title="All documents saved" copy="No documents need saving right now." icon="documents" />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {briefing.documentsToSave.slice(0, 6).map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

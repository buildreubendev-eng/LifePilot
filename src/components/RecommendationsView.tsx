"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { ActionRecommendation, RecommendationAcceptResult } from "@/lib/types";
import { CheckCircle2, ShieldAlert, FileText, ListTodo, Sparkles } from "lucide-react";
import { GenericSkeleton } from "@/components/Skeleton";

export function RecommendationsView() {
  const [recommendations, setRecommendations] = useState<ActionRecommendation[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [lastAccepted, setLastAccepted] = useState<RecommendationAcceptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    const body = await fetchJson<{ recommendations: ActionRecommendation[] }>("/api/life-admin/recommendations");
    setRecommendations(body.recommendations);
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        await loadRecommendations();
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load recommendations");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void init();
    return () => {
      active = false;
    };
  }, [loadRecommendations]);

  async function acceptRecommendation(id: string) {
    setProcessingId(id);
    try {
      const result = await fetchJson<RecommendationAcceptResult>(`/api/life-admin/recommendations/${id}/accept`, {
        method: "POST",
      });
      setLastAccepted(result);
      setAcceptedIds((prev) => new Set([...prev, id]));
      await loadRecommendations();
      setError(null);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Unable to accept recommendation");
    } finally {
      setProcessingId(null);
    }
  }

  const riskColor = (risk: string) => {
    switch (risk) {
      case "high": return "bg-red-500/15 text-red-400 border-red-500/30";
      case "medium": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      default: return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500/15 text-red-400 border-red-500/30";
      case "high": return "bg-amber-500/15 text-amber-400 border-amber-500/30";
      default: return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    }
  };

  if (isLoading) {
    return <GenericSkeleton />;
  }

  return (
    <div className="animate-fade-in pb-20">
      <section className="py-4 mb-8">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Recommendations</h1>
        <p className="mt-3 max-w-3xl text-lg font-light leading-7 text-stone-400">
          PLOS suggests safe next moves from inbox state. Low-risk actions execute instantly; sensitive actions become approval requests.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-4 mb-10">
        <MetricCard label="Total" value={recommendations.length} detail="Generated from active items" icon={<Sparkles size={20} />} />
        <MetricCard label="Approvals" value={recommendations.filter((item) => item.actionType === "create_approval").length} detail="Sensitive actions" icon={<ShieldAlert size={20} />} trend="warning" />
        <MetricCard label="Documents" value={recommendations.filter((item) => item.actionType === "save_document").length} detail="Records to save" icon={<FileText size={20} />} trend="success" />
        <MetricCard label="Tasks" value={recommendations.filter((item) => item.actionType === "create_task").length} detail="Explicit action tracking" icon={<ListTodo size={20} />} />
      </div>

      {lastAccepted ? (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 backdrop-blur-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <span className="text-sm font-bold text-emerald-300">Accepted: {lastAccepted.recommendation.title}</span>
          </div>
          <div className="mt-2 ml-11 text-sm text-emerald-400/80">
            {lastAccepted.approval && <p>Approval request created — review it on the Approvals page.</p>}
            {lastAccepted.document && <p>Document saved to your vault.</p>}
            {lastAccepted.task && <p>Task added to your action list.</p>}
          </div>
        </div>
      ) : null}
      {error ? <div className="mb-8 rounded-lg border border-red-500/30 bg-red-950/30 p-4 text-sm font-semibold text-red-200">{error}</div> : null}

      <Section title="Recommendation Queue">
        {recommendations.length === 0 ? (
          <EmptyState
            title="No recommendations right now"
            copy="As new items arrive or statuses change, PLOS will generate safe next moves here. Process inbox items to trigger new suggestions."
            icon="tasks"
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {recommendations.map((recommendation) => {
              const isAccepted = acceptedIds.has(recommendation.id);
              return (
                <div
                  key={recommendation.id}
                  className={`relative rounded-2xl border p-5 shadow-lg backdrop-blur-md transition-all ${
                    isAccepted
                      ? "bg-emerald-950/10 border-emerald-500/20 opacity-70"
                      : "bg-black/40 border-white/5 hover:border-white/20 hover:bg-black/60 hover:shadow-2xl"
                  }`}
                >
                  {isAccepted && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      <CheckCircle2 size={12} />
                      Accepted
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-lg border bg-white/5 border-white/10 px-2.5 py-1 text-xs font-semibold capitalize text-stone-300">
                      {recommendation.actionType.replaceAll("_", " ")}
                    </span>
                    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold capitalize ${riskColor(recommendation.riskLevel)}`}>
                      {recommendation.riskLevel} risk
                    </span>
                    <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-bold capitalize ${priorityColor(recommendation.priority)}`}>
                      {recommendation.priority}
                    </span>
                  </div>
                  <h2 className={`text-base font-bold leading-snug ${isAccepted ? "text-stone-500 line-through" : "text-white"}`}>
                    {recommendation.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-stone-400">{recommendation.description}</p>
                  <p className="mt-2 text-sm font-semibold text-stone-300">{recommendation.reason}</p>
                  {recommendation.dueDate && (
                    <p className="mt-1 text-xs text-stone-500">
                      Due: {new Date(recommendation.dueDate + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  )}
                  {!isAccepted && (
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => void acceptRecommendation(recommendation.id)}
                        disabled={processingId !== null}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                      >
                        {processingId === recommendation.id ? (
                          <>
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            {recommendation.acceptLabel}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

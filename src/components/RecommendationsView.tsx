"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { ActionRecommendation, RecommendationAcceptResult } from "@/lib/types";

export function RecommendationsView() {
  const [recommendations, setRecommendations] = useState<ActionRecommendation[]>([]);
  const [accepted, setAccepted] = useState<RecommendationAcceptResult | null>(null);
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
      setAccepted(result);
      await loadRecommendations();
      setError(null);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Unable to accept recommendation");
    } finally {
      setProcessingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-400">Loading recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-white">Recommendations</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-400">
          PLOS suggests safe next moves from inbox state. Low-risk recommendations can create tasks or save documents; sensitive actions become approval requests.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total" value={recommendations.length} detail="Generated from active life-admin items" />
        <MetricCard label="Approvals" value={recommendations.filter((item) => item.actionType === "create_approval").length} detail="Sensitive actions" />
        <MetricCard label="Documents" value={recommendations.filter((item) => item.actionType === "save_document").length} detail="Records to save" />
        <MetricCard label="Tasks" value={recommendations.filter((item) => item.actionType === "create_task").length} detail="Explicit action tracking" />
      </div>

      {accepted ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M20 6 9 17l-5-5"/></svg>
            <span className="text-sm font-semibold text-emerald-800">Accepted: {accepted.recommendation.title}</span>
          </div>
          {accepted.approval && <p className="mt-1 text-sm text-emerald-700">Approval request created — review it on the Approvals page.</p>}
          {accepted.document && <p className="mt-1 text-sm text-emerald-700">Document saved to your vault.</p>}
          {accepted.task && <p className="mt-1 text-sm text-emerald-700">Task added to your action list.</p>}
        </div>
      ) : null}
      {error ? <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div> : null}

      <Section title="Recommendation Queue">
        {recommendations.length === 0 ? (
          <EmptyState title="No recommendations right now" copy="As new items arrive or statuses change, PLOS will generate safe next moves here." icon="tasks" />
        ) : (
          <div className="grid gap-3">
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="rounded-lg border border-white/10 bg-black/40 p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold capitalize text-stone-300">
                        {recommendation.actionType.replaceAll("_", " ")}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        recommendation.riskLevel === "high" ? "bg-red-100 text-red-800" :
                        recommendation.riskLevel === "medium" ? "bg-amber-100 text-amber-800" :
                        "bg-emerald-100 text-emerald-800"
                      }`}>
                        {recommendation.riskLevel} risk
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        recommendation.priority === "urgent" ? "bg-red-100 text-red-800" :
                        recommendation.priority === "high" ? "bg-amber-100 text-amber-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {recommendation.priority}
                      </span>
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-white">{recommendation.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-400">{recommendation.description}</p>
                    <p className="mt-2 text-sm font-semibold text-stone-300">{recommendation.reason}</p>
                    {recommendation.dueDate && (
                      <p className="mt-1 text-xs text-stone-400">Due: {new Date(recommendation.dueDate + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void acceptRecommendation(recommendation.id)}
                    disabled={processingId !== null}
                    className="shrink-0 rounded-md bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    {processingId === recommendation.id ? "Processing..." : recommendation.acceptLabel}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

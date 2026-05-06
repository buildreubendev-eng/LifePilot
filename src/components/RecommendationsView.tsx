"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { ActionRecommendation, RecommendationAcceptResult } from "@/lib/types";

export function RecommendationsView() {
  const [recommendations, setRecommendations] = useState<ActionRecommendation[]>([]);
  const [accepted, setAccepted] = useState<RecommendationAcceptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadRecommendations() {
    const body = await fetchJson<{ recommendations: ActionRecommendation[] }>("/api/life-admin/recommendations");
    setRecommendations(body.recommendations);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialRecommendations() {
      try {
        const body = await fetchJson<{ recommendations: ActionRecommendation[] }>("/api/life-admin/recommendations");
        if (active) {
          setRecommendations(body.recommendations);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load recommendations");
        }
      }
    }

    void loadInitialRecommendations();
    return () => {
      active = false;
    };
  }, []);

  async function acceptRecommendation(id: string) {
    try {
      const result = await fetchJson<RecommendationAcceptResult>(`/api/life-admin/recommendations/${id}/accept`, {
        method: "POST",
      });
      setAccepted(result);
      await loadRecommendations();
      setError(null);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Unable to accept recommendation");
    }
  }

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Recommendations</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
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
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Accepted: {accepted.recommendation.title}
        </div>
      ) : null}
      {error ? <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div> : null}

      <Section title="Recommendation Queue">
        {recommendations.length === 0 ? (
          <EmptyState title="No recommendations right now" copy="As new items arrive or statuses change, PLOS will generate safe next moves here." />
        ) : (
          <div className="grid gap-3">
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold capitalize text-stone-700">
                        {recommendation.actionType.replaceAll("_", " ")}
                      </span>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold capitalize text-amber-800">
                        {recommendation.riskLevel} risk
                      </span>
                      <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold capitalize text-blue-800">
                        {recommendation.priority}
                      </span>
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-stone-950">{recommendation.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{recommendation.description}</p>
                    <p className="mt-2 text-sm font-semibold text-stone-700">{recommendation.reason}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void acceptRecommendation(recommendation.id)}
                    className="rounded-md bg-stone-900 px-4 py-3 text-sm font-semibold text-white"
                  >
                    {recommendation.acceptLabel}
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

"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { AuditEvent } from "@/lib/types";

type EventTypeFilter = "all" | "status_change" | "save_document" | "create_task" | "approval" | "settings" | "integration" | "ingestion";

export function ActivityView() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>("all");

  const loadEvents = useCallback(async () => {
    const body = await fetchJson<{ auditLog: AuditEvent[] }>("/api/life-admin/audit?limit=50");
    setEvents(body.auditLog);
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        await loadEvents();
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load activity");
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
  }, [loadEvents]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await loadEvents();
      setError(null);
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh activity");
    } finally {
      setIsRefreshing(false);
    }
  }

  const filtered = typeFilter === "all" ? events : events.filter((e) => e.type.includes(typeFilter));

  const typeCounts = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.entityType] = (acc[e.entityType] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-400">Loading activity log...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-black text-white">Activity</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-400">
              Backend audit trail for status changes, saved documents, task creation, approvals, settings, integrations, and ingestion.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="shrink-0 flex items-center gap-2 rounded-md bg-black/40 px-4 py-2.5 text-sm font-semibold text-stone-300 ring-1 border border-white/10 hover:bg-black/20 disabled:opacity-50"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isRefreshing ? "animate-spin" : ""}>
              <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
            </svg>
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>
      {error ? <div className="mb-4 rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Events" value={events.length} detail="All recorded actions" />
        <MetricCard label="Items" value={typeCounts["item"] || 0} detail="Item-related events" />
        <MetricCard label="Approvals" value={typeCounts["approval"] || 0} detail="Approval events" />
        <MetricCard label="Other" value={events.length - (typeCounts["item"] || 0) - (typeCounts["approval"] || 0)} detail="Tasks, documents, settings" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", "status_change", "save_document", "create_task", "approval", "settings", "integration", "ingestion"] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setTypeFilter(filter)}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold capitalize transition ${typeFilter === filter ? "bg-emerald-600 text-white" : "bg-black/40 text-stone-300 ring-1 border border-white/10 hover:bg-black/20"}`}
          >
            {filter.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      <Section title="Audit Log">
        {filtered.length === 0 ? (
          <EmptyState title="No activity yet" copy={typeFilter === "all" ? "Complete an action, create an approval, or run ingestion to populate the audit log." : `No events matching "${typeFilter.replaceAll("_", " ")}".`} icon={typeFilter === "all" ? "activity" : "search"} />
        ) : (
          <div className="divide-y divide-stone-200 rounded-lg border border-white/10 bg-black/40 shadow-sm">
            {filtered.map((event) => (
              <div key={event.id} className="p-4 hover:bg-black/20 transition-colors">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2 w-2 rounded-full ${
                        event.type.includes("approval") ? "bg-amber-500" :
                        event.type.includes("save") ? "bg-emerald-500" :
                        event.type.includes("create") ? "bg-blue-500" :
                        "bg-stone-400"
                      }`} />
                      <p className="text-sm font-semibold capitalize text-white">{event.type.replaceAll("_", " ")}</p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-stone-400">{event.summary}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
                      {event.entityType}: {event.entityId.slice(0, 12)}...
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/5 px-2.5 py-1 text-xs font-semibold text-stone-300">
                    {new Date(event.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

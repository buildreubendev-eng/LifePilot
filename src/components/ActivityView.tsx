"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { AuditEvent } from "@/lib/types";
import {
  Activity,
  RefreshCw,
  CheckCircle2,
  FileText,
  Settings2,
  Plug,
  Shield,
  Upload,
  Clock,
  ArrowUpDown,
  ListTodo,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type EventTypeFilter = "all" | "status_change" | "save_document" | "create_task" | "approval" | "settings" | "integration" | "ingestion";

const eventTypeConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  status_updated: { icon: <ArrowUpDown size={12} />, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  item_snoozed: { icon: <Clock size={12} />, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
  document_saved: { icon: <FileText size={12} />, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
  task_created: { icon: <ListTodo size={12} />, color: "text-violet-400", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/20" },
  task_updated: { icon: <ListTodo size={12} />, color: "text-violet-400", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/20" },
  approval_created: { icon: <Shield size={12} />, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
  approval_reviewed: { icon: <Shield size={12} />, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
  settings_updated: { icon: <Settings2 size={12} />, color: "text-stone-400", bgColor: "bg-white/5", borderColor: "border-white/10" },
  integration_updated: { icon: <Plug size={12} />, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  store_reset: { icon: <RefreshCw size={12} />, color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" },
};

const filterConfig: Record<EventTypeFilter, { label: string; icon: React.ReactNode }> = {
  all: { label: "All Events", icon: <Activity size={12} /> },
  status_change: { label: "Status", icon: <ArrowUpDown size={12} /> },
  save_document: { label: "Documents", icon: <FileText size={12} /> },
  create_task: { label: "Tasks", icon: <ListTodo size={12} /> },
  approval: { label: "Approvals", icon: <Shield size={12} /> },
  settings: { label: "Settings", icon: <Settings2 size={12} /> },
  integration: { label: "Integrations", icon: <Plug size={12} /> },
  ingestion: { label: "Ingestion", icon: <Upload size={12} /> },
};

function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const minutes = Math.round((now - then) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString("en", { month: "short", day: "numeric" });
}

export function ActivityView() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>("all");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    const body = await fetchJson<{ auditLog: AuditEvent[] }>("/api/life-admin/audit?limit=50");
    setEvents(body.auditLog);
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try { await loadEvents(); }
      catch (loadError) { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load activity"); }
      finally { if (active) setIsLoading(false); }
    }
    void init();
    return () => { active = false; };
  }, [loadEvents]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try { await loadEvents(); setError(null); }
    catch (refreshError) { setError(refreshError instanceof Error ? refreshError.message : "Unable to refresh activity"); }
    finally { setIsRefreshing(false); }
  }

  const filtered = typeFilter === "all" ? events : events.filter((e) => e.type.includes(typeFilter));

  const typeCounts: Record<string, number> = {};
  for (const e of events) {
    typeCounts[e.entityType] = (typeCounts[e.entityType] || 0) + 1;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-500" />
          <p className="tracking-widest uppercase text-stone-500 text-sm font-semibold">Loading Audit Trail</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      <section className="py-4 mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Audit Trail</h1>
            <p className="mt-3 max-w-3xl text-lg font-light leading-7 text-stone-400">
              Complete history of administrative actions — status changes, documents, approvals, integrations, and system events.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="shrink-0 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-stone-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {error && <div className="mb-6 rounded-lg bg-red-950/50 border border-red-500/30 px-4 py-3 text-sm font-medium text-red-200">{error}</div>}

      {/* Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Activity size={18} className="text-blue-400" /></div>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{events.length}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">Total Events</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle2 size={18} className="text-emerald-400" /></div>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{typeCounts["message"] || 0}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">Item Events</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><Shield size={18} className="text-amber-400" /></div>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{typeCounts["approval"] || 0}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">Approval Events</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-violet-500/10"><Settings2 size={18} className="text-violet-400" /></div>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{(typeCounts["task"] || 0) + (typeCounts["document"] || 0) + (typeCounts["settings"] || 0) + (typeCounts["integration"] || 0)}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">System Events</p>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(Object.entries(filterConfig) as [EventTypeFilter, typeof filterConfig[EventTypeFilter]][]).map(([key, config]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTypeFilter(key)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
              typeFilter === key
                ? "bg-white/10 text-white border-white/20 shadow-lg"
                : "bg-white/[0.02] text-stone-400 border-white/5 hover:bg-white/5 hover:text-white"
            }`}
          >
            {config.icon}
            {config.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <Section title={`Audit Log (${filtered.length})`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No activity yet"
            copy={typeFilter === "all" ? "Complete an action, create an approval, or run ingestion to populate the audit log." : `No events matching "${typeFilter.replaceAll("_", " ")}".`}
            icon={typeFilter === "all" ? "activity" : "search"}
          />
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/5" />

            <div className="grid gap-1">
              {filtered.map((event) => {
                const config = eventTypeConfig[event.type] ?? { icon: <Activity size={12} />, color: "text-stone-400", bgColor: "bg-white/5", borderColor: "border-white/10" };
                const isExpanded = expandedEventId === event.id;

                return (
                  <div key={event.id} className="relative pl-12">
                    {/* Timeline dot */}
                    <div className={`absolute left-2.5 top-4 flex h-[14px] w-[14px] items-center justify-center rounded-full border ${config.borderColor} ${config.bgColor}`}>
                      <div className={`h-1.5 w-1.5 rounded-full ${config.color.replace("text-", "bg-")}`} />
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                      className="w-full text-left rounded-xl border border-transparent p-3 hover:bg-white/[0.02] hover:border-white/5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={`shrink-0 mt-0.5 ${config.color}`}>{config.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${config.bgColor} ${config.borderColor} ${config.color}`}>
                                {event.type.replaceAll("_", " ")}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">
                                {event.entityType}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-stone-300 leading-relaxed">{event.summary}</p>
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-stone-600 whitespace-nowrap">{formatTimeAgo(event.createdAt)}</span>
                          {isExpanded ? <ChevronUp size={12} className="text-stone-600" /> : <ChevronDown size={12} className="text-stone-600" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 ml-7 animate-slide-up rounded-lg border border-white/5 bg-black/30 p-3">
                          <div className="grid gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-stone-500">Event ID</span>
                              <span className="text-stone-300 font-mono">{event.id.slice(0, 16)}...</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-500">Entity</span>
                              <span className="text-stone-300">{event.entityType}: {event.entityId.slice(0, 12)}...</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-500">Timestamp</span>
                              <span className="text-stone-300">{new Date(event.createdAt).toLocaleString()}</span>
                            </div>
                            {event.metadata && Object.keys(event.metadata).length > 0 && (
                              <div className="pt-2 border-t border-white/5">
                                <p className="text-stone-500 mb-1">Metadata</p>
                                {Object.entries(event.metadata).map(([k, v]) => (
                                  <div key={k} className="flex justify-between">
                                    <span className="text-stone-500">{k}</span>
                                    <span className="text-stone-300">{String(v)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

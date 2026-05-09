"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { IntegrationConnection, IntegrationStatus } from "@/lib/types";

const statusOptions: IntegrationStatus[] = ["not_connected", "connected", "paused", "error"];

const providerIcons: Record<string, React.ReactNode> = {
  gmail: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  "google-calendar": (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  plaid: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  health: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
    </svg>
  ),
};

function getHealthScore(integration: IntegrationConnection, now: number): { score: number; label: string; color: string } {
  if (integration.status === "error") return { score: 0, label: "Unhealthy", color: "text-red-600" };
  if (integration.status === "not_connected") return { score: 0, label: "Not Connected", color: "text-stone-400" };
  if (integration.status === "paused") return { score: 50, label: "Paused", color: "text-amber-600" };

  if (!integration.lastSyncAt) return { score: 70, label: "Connected", color: "text-emerald-600" };

  const minutes = Math.round((now - new Date(integration.lastSyncAt).getTime()) / 60_000);
  if (minutes < 15) return { score: 100, label: "Healthy", color: "text-emerald-600" };
  if (minutes < 60) return { score: 85, label: "Good", color: "text-emerald-500" };
  if (minutes < 1440) return { score: 60, label: "Stale", color: "text-amber-500" };
  return { score: 30, label: "Stale (24h+)", color: "text-red-500" };
}

function formatSyncAge(lastSyncAt: string | undefined, now: number): string {
  if (!lastSyncAt) return "Never";
  const minutes = Math.round((now - new Date(lastSyncAt).getTime()) / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function IntegrationsView() {
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingProvider, setUpdatingProvider] = useState<string | null>(null);
  const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const loadIntegrations = useCallback(async () => {
    const body = await fetchJson<{ integrations: IntegrationConnection[] }>("/api/life-admin/integrations");
    setIntegrations(body.integrations);
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        await loadIntegrations();
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load integrations");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void init();
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [loadIntegrations]);

  async function updateStatus(provider: IntegrationConnection["provider"], status: IntegrationStatus) {
    setUpdatingProvider(provider);
    try {
      await fetchJson<{ integration: IntegrationConnection }>(`/api/life-admin/integrations/${provider}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          lastSyncAt: status === "connected" ? new Date().toISOString() : undefined,
        }),
      });
      await loadIntegrations();
      setError(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update integration");
    } finally {
      setUpdatingProvider(null);
    }
  }

  const connected = integrations.filter((i) => i.status === "connected");
  const errored = integrations.filter((i) => i.status === "error");
  const avgHealth = integrations.length > 0
    ? Math.round(integrations.reduce((acc, i) => acc + getHealthScore(i, now).score, 0) / integrations.length)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-400">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <section className="py-4">
        <h1 className="text-4xl font-black text-white">Integrations</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-400">
          Connector health monitoring and status management. Each provider shows sync freshness, permission scopes, and connection health.
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5 stagger-children">
        <MetricCard
          label="Total"
          value={integrations.length}
          detail="Configured connectors"
        />
        <MetricCard
          label="Connected"
          value={connected.length}
          detail="Active and syncing"
          accent={connected.length > 0 ? "success" : "default"}
        />
        <MetricCard
          label="Errors"
          value={errored.length}
          detail="Needs attention"
          accent={errored.length > 0 ? "danger" : "default"}
          trend={errored.length > 0 ? "down" : "neutral"}
        />
        <MetricCard
          label="Scopes"
          value={integrations.reduce((acc, i) => acc + i.permissionScopes.length, 0)}
          detail="Total permission scopes"
        />
        <MetricCard
          label="Health"
          value={`${avgHealth}%`}
          detail="Average connector health"
          accent={avgHealth >= 80 ? "success" : avgHealth >= 50 ? "warning" : "danger"}
        />
      </div>

      {error ? <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-800">{error}</div> : null}

      <Section title="Connector Health Dashboard">
        {integrations.length === 0 ? (
          <EmptyState title="No integrations" copy="Integrations will appear when configured." icon="tasks" />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 stagger-children">
            {integrations.map((integration) => {
              const health = getHealthScore(integration, now);
              const isExpanded = expandedProvider === integration.provider;

              return (
                <div
                  key={integration.provider}
                  className={`rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:shadow-md ${
                    integration.status === "connected"
                      ? "border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-white"
                      : integration.status === "error"
                        ? "border-red-200 bg-gradient-to-br from-red-50/40 to-white"
                        : "border-white/10 bg-black/40"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/40 border border-white/5 shadow-sm">
                        {providerIcons[integration.provider] ?? (
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-400">
                            <circle cx="12" cy="12" r="10" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{integration.label}</h2>
                        <p className="mt-0.5 text-sm text-stone-400">{integration.notes}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      integration.status === "connected" ? "bg-emerald-100 text-emerald-800" :
                      integration.status === "error" ? "bg-red-100 text-red-800" :
                      integration.status === "paused" ? "bg-amber-100 text-amber-800" :
                      "bg-white/5 text-stone-400"
                    }`}>{integration.status.replaceAll("_", " ")}</span>
                  </div>

                  {/* Health & sync row */}
                  <div className="mt-4 flex items-center gap-6 rounded-xl bg-black/20 px-4 py-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Health</p>
                      <p className={`mt-0.5 text-sm font-bold ${health.color}`}>{health.label}</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Last Sync</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {integration.status === "connected" && (
                          <span className={`inline-block h-2 w-2 rounded-full ${
                            health.score >= 80 ? "bg-emerald-400 animate-pulse" : health.score >= 50 ? "bg-amber-400" : "bg-red-400"
                          }`} />
                        )}
                        <p className="text-sm font-semibold text-stone-300">{formatSyncAge(integration.lastSyncAt ?? undefined, now)}</p>
                      </div>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Connected</p>
                      <p className="mt-0.5 text-sm font-semibold text-stone-300">
                        {integration.connectedAt
                          ? new Date(integration.connectedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {integration.permissionScopes.map((scope) => (
                      <span key={scope} className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                        integration.status === "connected"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-white/5 text-stone-400"
                      }`}>
                        {scope}
                      </span>
                    ))}
                  </div>

                  {/* Expand / controls */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedProvider(isExpanded ? null : integration.provider)}
                      className="flex items-center gap-1 text-xs font-semibold text-stone-400 hover:text-stone-300 transition"
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      >
                        <polyline points="9,18 15,12 9,6" />
                      </svg>
                      {isExpanded ? "Hide controls" : "Show controls"}
                    </button>
                    {integration.status === "connected" && (
                      <button
                        type="button"
                        onClick={() => void updateStatus(integration.provider, "connected")}
                        disabled={updatingProvider !== null}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-semibold text-stone-400 transition hover:bg-black/20 disabled:opacity-50"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={updatingProvider === integration.provider ? "animate-spin" : ""}>
                          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
                        </svg>
                        Force Sync
                      </button>
                    )}
                  </div>

                  {/* Expanded status controls */}
                  {isExpanded && (
                    <div className="mt-3 animate-slide-up">
                      <p className="text-xs font-semibold text-stone-400 mb-2">Set connection status:</p>
                      <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                        {statusOptions.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => void updateStatus(integration.provider, status)}
                            disabled={updatingProvider !== null}
                            className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition disabled:opacity-50 ${
                              integration.status === status
                                ? "bg-emerald-600 text-white"
                                : "bg-black/40 text-stone-400 ring-1 border border-white/10 hover:bg-black/20"
                            }`}
                          >
                            {status.replaceAll("_", " ")}
                          </button>
                        ))}
                      </div>
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

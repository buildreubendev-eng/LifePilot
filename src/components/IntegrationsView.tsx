"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { IntegrationConnection, IntegrationStatus } from "@/lib/types";
import {
  Mail,
  Calendar,
  DollarSign,
  Heart,
  Wifi,
  WifiOff,
  Pause,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  Zap,
  Settings2,
  Activity,
} from "lucide-react";
import { IntegrationsSkeleton } from "@/components/Skeleton";

const statusOptions: IntegrationStatus[] = ["not_connected", "connected", "paused", "error"];

const providerConfig: Record<string, { icon: React.ReactNode; color: string; gradient: string; description: string }> = {
  gmail: {
    icon: <Mail size={24} />,
    color: "text-red-400",
    gradient: "from-red-500/10 to-red-500/5",
    description: "Email parsing for bills, receipts, confirmations, and personal correspondence.",
  },
  "google-calendar": {
    icon: <Calendar size={24} />,
    color: "text-blue-400",
    gradient: "from-blue-500/10 to-blue-500/5",
    description: "Appointment tracking, schedule conflict detection, and deadline monitoring.",
  },
  plaid: {
    icon: <DollarSign size={24} />,
    color: "text-emerald-400",
    gradient: "from-emerald-500/10 to-emerald-500/5",
    description: "Bank alerts, transaction monitoring, bill detection, and subscription tracking.",
  },
  health: {
    icon: <Heart size={24} />,
    color: "text-rose-400",
    gradient: "from-rose-500/10 to-rose-500/5",
    description: "Health portal notifications, appointment reminders, and prescription alerts.",
  },
};

function getHealthConfig(integration: IntegrationConnection, now: number) {
  if (integration.status === "error") return { score: 0, label: "Unhealthy", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", icon: <XCircle size={14} /> };
  if (integration.status === "not_connected") return { score: 0, label: "Offline", color: "text-stone-500", bgColor: "bg-white/5", borderColor: "border-white/10", icon: <WifiOff size={14} /> };
  if (integration.status === "paused") return { score: 50, label: "Paused", color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20", icon: <Pause size={14} /> };
  if (!integration.lastSyncAt) return { score: 70, label: "Connected", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", icon: <CheckCircle2 size={14} /> };

  const minutes = Math.round((now - new Date(integration.lastSyncAt).getTime()) / 60_000);
  if (minutes < 15) return { score: 100, label: "Healthy", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", icon: <CheckCircle2 size={14} /> };
  if (minutes < 60) return { score: 85, label: "Good", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20", icon: <CheckCircle2 size={14} /> };
  if (minutes < 1440) return { score: 60, label: "Stale", color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20", icon: <AlertTriangle size={14} /> };
  return { score: 30, label: "Stale (24h+)", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", icon: <AlertTriangle size={14} /> };
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

function estimateNextSync(lastSyncAt: string | undefined): string {
  if (!lastSyncAt) return "After initial setup";
  const next = new Date(new Date(lastSyncAt).getTime() + 15 * 60_000);
  const now = new Date();
  if (next <= now) return "Scheduled now";
  const mins = Math.round((next.getTime() - now.getTime()) / 60_000);
  if (mins < 60) return `~${mins}m`;
  return `~${Math.round(mins / 60)}h`;
}

export function IntegrationsView() {
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load integrations");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void init();
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => { active = false; clearInterval(interval); };
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
      setNotice(`${provider} ${status === "connected" ? "connected" : status === "paused" ? "paused" : status === "not_connected" ? "disconnected" : "set to error state"}.`);
      setTimeout(() => setNotice(null), 4000);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update integration");
    } finally {
      setUpdatingProvider(null);
    }
  }

  const connected = integrations.filter((i) => i.status === "connected");
  const errored = integrations.filter((i) => i.status === "error");
  const avgHealth = integrations.length > 0
    ? Math.round(integrations.reduce((acc, i) => acc + getHealthConfig(i, now).score, 0) / integrations.length)
    : 0;

  if (isLoading) {
    return <IntegrationsSkeleton />;
  }

  return (
    <div className="animate-fade-in pb-20">
      <section className="py-4 mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Integrations</h1>
            <p className="mt-3 max-w-3xl text-lg font-light leading-7 text-stone-400">
              Connector health, sync status, and setup management. Each data source feeds into your executive inbox.
            </p>
          </div>
        </div>
      </section>

      {error && <div className="mb-6 rounded-lg bg-red-950/50 border border-red-500/30 px-4 py-3 text-sm font-medium text-red-200">{error}</div>}
      {notice && <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm font-medium text-emerald-200">{notice}</div>}

      {/* System Health Overview */}
      <div className="mb-10 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><Wifi size={18} className="text-emerald-400" /></div>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{connected.length}/{integrations.length}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">Connected</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Activity size={18} className="text-blue-400" /></div>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{avgHealth}%</p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">System Health</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${errored.length > 0 ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
              {errored.length > 0 ? <AlertTriangle size={18} className="text-red-400" /> : <CheckCircle2 size={18} className="text-emerald-400" />}
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{errored.length}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">Errors</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-violet-500/10"><Shield size={18} className="text-violet-400" /></div>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{integrations.reduce((acc, i) => acc + i.permissionScopes.length, 0)}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">Permission Scopes</p>
        </div>
      </div>

      {/* Connector Cards */}
      <Section title="Data Sources">
        {integrations.length === 0 ? (
          <EmptyState title="No integrations configured" copy="Data sources will appear when configured." icon="tasks" />
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 stagger-children">
            {integrations.map((integration) => {
              const health = getHealthConfig(integration, now);
              const config = providerConfig[integration.provider];
              const isExpanded = expandedProvider === integration.provider;
              const isUpdating = updatingProvider === integration.provider;

              return (
                <div
                  key={integration.provider}
                  className={`rounded-2xl border p-6 shadow-lg backdrop-blur-md transition-all duration-300 ${
                    integration.status === "connected"
                      ? "bg-gradient-to-br border-emerald-500/20 hover:border-emerald-500/30 " + (config?.gradient ?? "from-white/[0.02] to-transparent")
                      : integration.status === "error"
                        ? "bg-gradient-to-br from-red-500/5 to-transparent border-red-500/20"
                        : integration.status === "paused"
                          ? "bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/20"
                          : "bg-black/40 border-white/5 hover:border-white/20"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black/30 border border-white/5 ${config?.color ?? "text-stone-400"}`}>
                        {config?.icon ?? <Settings2 size={24} />}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{integration.label}</h2>
                        <p className="mt-0.5 text-xs text-stone-500 leading-relaxed max-w-xs">
                          {config?.description ?? integration.notes}
                        </p>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold ${health.bgColor} ${health.borderColor} ${health.color}`}>
                      {health.icon}
                      {health.label}
                    </span>
                  </div>

                  {/* Sync Metrics Strip */}
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Last Sync</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        {integration.status === "connected" && (
                          <span className={`inline-block h-2 w-2 rounded-full ${
                            health.score >= 80 ? "bg-emerald-400 animate-pulse" : health.score >= 50 ? "bg-amber-400" : "bg-red-400"
                          }`} />
                        )}
                        <p className="text-sm font-bold text-white">{formatSyncAge(integration.lastSyncAt ?? undefined, now)}</p>
                      </div>
                    </div>
                    <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Next Sync</p>
                      <p className="mt-1 text-sm font-bold text-stone-300">{estimateNextSync(integration.lastSyncAt ?? undefined)}</p>
                    </div>
                    <div className="rounded-xl bg-black/20 border border-white/5 p-3">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Connected</p>
                      <p className="mt-1 text-sm font-bold text-stone-300">
                        {integration.connectedAt
                          ? new Date(integration.connectedAt).toLocaleDateString("en", { month: "short", day: "numeric" })
                          : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Permission Scopes */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {integration.permissionScopes.map((scope) => (
                      <span
                        key={scope}
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border ${
                          integration.status === "connected"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-white/5 text-stone-500 border-white/5"
                        }`}
                      >
                        {scope}
                      </span>
                    ))}
                  </div>

                  {/* Action Bar */}
                  <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedProvider(isExpanded ? null : integration.provider)}
                      className="flex items-center gap-1.5 text-xs font-bold text-stone-400 hover:text-white transition-colors"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? "Hide Setup" : "Configure"}
                    </button>
                    <div className="flex gap-2">
                      {integration.status === "connected" && (
                        <button
                          type="button"
                          onClick={() => void updateStatus(integration.provider, "connected")}
                          disabled={updatingProvider !== null}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-stone-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50"
                        >
                          <RefreshCw size={12} className={isUpdating ? "animate-spin" : ""} />
                          Sync Now
                        </button>
                      )}
                      {integration.status === "not_connected" && (
                        <button
                          type="button"
                          onClick={() => void updateStatus(integration.provider, "connected")}
                          disabled={updatingProvider !== null}
                          className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 hover:-translate-y-0.5 disabled:opacity-50"
                        >
                          <Zap size={12} />
                          Connect
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Setup Panel */}
                  {isExpanded && (
                    <div className="mt-4 animate-slide-up rounded-xl border border-white/5 bg-black/30 p-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">Connection Controls</h3>

                      {/* Setup wizard steps (for not_connected) */}
                      {integration.status === "not_connected" && (
                        <div className="mb-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4">
                          <h4 className="text-sm font-bold text-indigo-300 mb-2">Setup Guide</h4>
                          <div className="grid gap-2">
                            {[
                              { step: 1, text: "Click 'Connect' to begin OAuth authorization", done: false },
                              { step: 2, text: "Grant the requested permission scopes", done: false },
                              { step: 3, text: "PLOS begins syncing automatically", done: false },
                            ].map((s) => (
                              <div key={s.step} className="flex items-center gap-2">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[10px] font-bold text-indigo-400">
                                  {s.step}
                                </span>
                                <span className="text-xs text-stone-400">{s.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs font-semibold text-stone-400 mb-2">Set connection status:</p>
                      <div className="grid gap-2 grid-cols-2 sm:grid-cols-4">
                        {statusOptions.map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => void updateStatus(integration.provider, status)}
                            disabled={updatingProvider !== null}
                            className={`rounded-lg px-3 py-2.5 text-xs font-bold capitalize transition-all disabled:opacity-50 ${
                              integration.status === status
                                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                                : "bg-white/5 text-stone-400 border border-white/5 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {status.replaceAll("_", " ")}
                          </button>
                        ))}
                      </div>

                      {/* Disconnect warning */}
                      {integration.status === "connected" && (
                        <div className="mt-4 pt-3 border-t border-white/5">
                          <button
                            type="button"
                            onClick={() => void updateStatus(integration.provider, "not_connected")}
                            disabled={updatingProvider !== null}
                            className="text-xs font-semibold text-red-400/60 hover:text-red-400 transition-colors disabled:opacity-50"
                          >
                            Disconnect {integration.label}
                          </button>
                        </div>
                      )}
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

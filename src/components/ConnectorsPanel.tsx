"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { fetchJson } from "@/lib/apiClient";
import type { IntegrationConnection, IntegrationStatus } from "@/lib/types";

function computeSyncFreshness(lastSyncAt: string | undefined, now: number): { label: string; dotColor: string } | null {
  if (!lastSyncAt) return null;
  const minutes = Math.round((now - new Date(lastSyncAt).getTime()) / 60_000);
  const label = minutes < 1 ? "Just now" : minutes < 60 ? `${minutes}m ago` : `${Math.round(minutes / 60)}h ago`;
  const dotColor = minutes < 10 ? "bg-emerald-400" : minutes < 60 ? "bg-amber-400" : "bg-red-400";
  return { label, dotColor };
}

const providerIcons: Record<string, React.ReactNode> = {
  gmail: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  "google-calendar": (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  plaid: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  health: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
    </svg>
  ),
};

const providerScopeDescriptions: Record<string, Record<string, string>> = {
  gmail: {
    "mail.readonly": "Read email messages and metadata",
    "mail.labels": "View and manage email labels",
    "mail.send": "Send emails on your behalf (action-gated)",
  },
  "google-calendar": {
    "calendar.readonly": "View your calendar events and details",
    "calendar.events": "Create and modify calendar events (action-gated)",
  },
  plaid: {
    "transactions.read": "Read recent bank transactions",
    "accounts.read": "View connected account balances",
    "identity.read": "Verify account holder identity",
  },
  health: {
    "records.read": "Read medical records and appointments",
    "prescriptions.read": "View prescription information",
  },
};

type PermissionStep = "overview" | "scopes" | "confirming" | "success";

export function ConnectorsPanel() {
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [authModal, setAuthModal] = useState<IntegrationConnection | null>(null);
  const [permissionStep, setPermissionStep] = useState<PermissionStep>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;

    async function loadIntegrations() {
      try {
        const body = await fetchJson<{ integrations: IntegrationConnection[] }>("/api/life-admin/integrations");
        if (active) {
          setIntegrations(body.integrations);
          setError(null);
        }
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

    void loadIntegrations();
    const interval = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  async function updateStatus(provider: string, status: IntegrationStatus) {
    try {
      await fetchJson<{ integration: IntegrationConnection }>(`/api/life-admin/integrations/${provider}`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          lastSyncAt: status === "connected" ? new Date().toISOString() : undefined,
          connectedAt: status === "connected" ? new Date().toISOString() : undefined,
        }),
      });

      setIntegrations((current) =>
        current.map((i) => (i.provider === provider ? { ...i, status } : i)),
      );
      setError(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update integration");
    }
  }

  function openAuthFlow(integration: IntegrationConnection) {
    setAuthModal(integration);
    setPermissionStep("overview");
  }

  async function handleConnect(provider: string) {
    setPermissionStep("confirming");
    await updateStatus(provider, "connected");
    setPermissionStep("success");
    setTimeout(() => {
      setAuthModal(null);
      setPermissionStep("overview");
    }, 1500);
  }

  const handleDisconnect = (provider: string) => {
    void updateStatus(provider, "not_connected");
  };

  function statusBadge(status: IntegrationStatus) {
    if (status === "connected") return <Badge variant="completed">Connected</Badge>;
    if (status === "error") return <Badge variant="urgent">Needs Re-auth</Badge>;
    if (status === "paused") return <Badge variant="medium">Paused</Badge>;
    return null;
  }

  function renderSyncFreshness(lastSyncAt?: string): React.ReactNode {
    const freshness = computeSyncFreshness(lastSyncAt, now);
    if (!freshness) return null;
    return (
      <div className="flex items-center gap-1.5">
        <span className={`inline-block h-2 w-2 rounded-full ${freshness.dotColor} animate-pulse`} />
        <span className="text-[11px] font-semibold text-stone-400">{freshness.label}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-white">Integrations & Connectors</h2>
      </div>
      <p className="mt-2 text-sm leading-6 text-stone-400">
        Link external services securely. PLOS requests read-only access by default; action permissions are requested per-action.
      </p>

      {error ? <p className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}

      {isLoading ? (
        <div className="mt-4 flex items-center justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-stone-900" />
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {integrations.map((integration) => (
            <div
              key={integration.provider}
              className={`rounded-xl border p-4 transition-all hover:shadow-sm ${
                integration.status === "connected"
                  ? "border-emerald-200 bg-emerald-50/30"
                  : integration.status === "error"
                    ? "border-red-200 bg-red-50/30"
                    : "border-white/10 bg-black/40"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/40 border border-white/5 shadow-sm">
                    {providerIcons[integration.provider] ?? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-400">
                        <circle cx="12" cy="12" r="10" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white">{integration.label}</h3>
                      {statusBadge(integration.status)}
                    </div>
                    <p className="mt-0.5 text-sm text-stone-400">{integration.notes}</p>
                    {integration.status === "connected" && (
                      <div className="mt-1.5 flex items-center gap-4">
                        {renderSyncFreshness(integration.lastSyncAt ?? undefined)}
                        {integration.connectedAt && (
                          <span className="text-[11px] text-stone-400">
                            Since {new Date(integration.connectedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {integration.permissionScopes.map((scope) => (
                        <span
                          key={scope}
                          className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            integration.status === "connected"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-white/5 text-stone-400"
                          }`}
                          title={providerScopeDescriptions[integration.provider]?.[scope] ?? scope}
                        >
                          {scope}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {integration.status === "not_connected" || integration.status === "error" ? (
                    <button
                      onClick={() => openAuthFlow(integration)}
                      className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800"
                    >
                      {integration.status === "error" ? "Reconnect" : "Connect"}
                    </button>
                  ) : integration.status === "connected" ? (
                    <button
                      onClick={() => handleDisconnect(integration.provider)}
                      className="rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-semibold text-stone-400 transition hover:bg-black/20"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => openAuthFlow(integration)}
                      className="rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-bold text-amber-800 transition hover:bg-amber-200"
                    >
                      Resume
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Multi-step permission flow modal */}
      {authModal && (
        <Modal isOpen={!!authModal} onClose={() => { setAuthModal(null); setPermissionStep("overview"); }} title={`Connect ${authModal.label}`}>
          {permissionStep === "overview" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4 rounded-xl bg-black/20 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/40 border border-white/5 shadow-sm">
                  {providerIcons[authModal.provider]}
                </div>
                <div>
                  <h3 className="font-bold text-white">{authModal.label}</h3>
                  <p className="text-sm text-stone-400">Read-only OAuth 2.0 connection</p>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span className="text-sm font-bold text-emerald-800">Privacy Guarantee</span>
                </div>
                <ul className="grid gap-1.5 text-sm text-emerald-700">
                  <li className="flex items-start gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    Data stays on your device
                  </li>
                  <li className="flex items-start gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    Read-only by default
                  </li>
                  <li className="flex items-start gap-2">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                    Disconnect anytime
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setPermissionStep("scopes")}
                className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-stone-800"
              >
                Review Permissions
              </button>
            </div>
          )}

          {permissionStep === "scopes" && (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-stone-400">
                PLOS is requesting the following permissions from your {authModal.label} account:
              </p>

              <div className="grid gap-2">
                {authModal.permissionScopes.map((scope) => {
                  const description = providerScopeDescriptions[authModal.provider]?.[scope];
                  const isActionScope = description?.includes("action-gated");
                  return (
                    <div
                      key={scope}
                      className={`flex items-start gap-3 rounded-xl p-3 ${
                        isActionScope ? "bg-amber-50 border border-amber-200" : "bg-black/20 border border-white/5"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        isActionScope ? "bg-amber-100" : "bg-emerald-100"
                      }`}>
                        {isActionScope ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-stone-200">{scope}</p>
                        <p className="text-xs text-stone-400">{description ?? "Standard permission scope"}</p>
                        {isActionScope && (
                          <p className="mt-1 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                            Requires approval before use
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPermissionStep("overview")}
                  className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-stone-400 transition hover:bg-black/20"
                >
                  Back
                </button>
                <button
                  onClick={() => void handleConnect(authModal.provider)}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800"
                >
                  Allow Access
                </button>
              </div>
            </div>
          )}

          {permissionStep === "confirming" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-stone-900" />
              <p className="text-sm font-semibold text-stone-400">Establishing secure connection...</p>
            </div>
          )}

          {permissionStep === "success" && (
            <div className="flex flex-col items-center gap-4 py-8 animate-scale-in">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-check-pop">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </div>
              <p className="text-lg font-bold text-white">Connected!</p>
              <p className="text-sm text-stone-400">{authModal.label} is now linked to PLOS.</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

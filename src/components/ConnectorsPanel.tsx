"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { fetchJson } from "@/lib/apiClient";
import type { IntegrationConnection, IntegrationStatus } from "@/lib/types";

export function ConnectorsPanel() {
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [authModal, setAuthModal] = useState<IntegrationConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    return () => {
      active = false;
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

  const handleConnect = (provider: string) => {
    void updateStatus(provider, "connected");
    setAuthModal(null);
  };

  const handleDisconnect = (provider: string) => {
    void updateStatus(provider, "not_connected");
  };

  function statusBadge(status: IntegrationStatus) {
    if (status === "connected") return <Badge variant="completed">Connected</Badge>;
    if (status === "error") return <Badge variant="urgent">Needs Re-auth</Badge>;
    if (status === "paused") return <Badge variant="medium">Paused</Badge>;
    return null;
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">Integrations & Connectors</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        Link external services securely. PLOS only requests read access by default. Action permissions (like sending emails) are requested on a per-action basis.
      </p>

      {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}

      {isLoading ? (
        <div className="mt-4 flex items-center justify-center py-6">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-200 border-t-stone-900" />
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          {integrations.map((integration) => (
            <div key={integration.provider} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-stone-200 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-stone-900">{integration.label}</h3>
                  {statusBadge(integration.status)}
                </div>
                <p className="mt-1 text-sm text-stone-600">{integration.notes}</p>
              </div>

              <div className="shrink-0">
                {integration.status === "not_connected" || integration.status === "error" ? (
                  <button
                    onClick={() => setAuthModal(integration)}
                    className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800"
                  >
                    Connect
                  </button>
                ) : integration.status === "connected" ? (
                  <button
                    onClick={() => handleDisconnect(integration.provider)}
                    className="rounded-md bg-stone-100 px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => setAuthModal(integration)}
                    className="rounded-md bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-200"
                  >
                    Resume
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {authModal && (
        <Modal isOpen={!!authModal} onClose={() => setAuthModal(null)} title={`Connect ${authModal.label}`}>
          <div className="flex flex-col gap-4 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-stone-900">Secure OAuth Request</h3>
            <p className="text-sm text-stone-600">
              PLOS is requesting read-only access to your {authModal.label} account to scan for life admin tasks.
            </p>
            {authModal.permissionScopes.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center">
                {authModal.permissionScopes.map((scope) => (
                  <span key={scope} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    {scope}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-4 flex gap-3">
              <button onClick={() => setAuthModal(null)} className="w-full rounded-md px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100 border border-stone-200">Cancel</button>
              <button onClick={() => handleConnect(authModal.provider)} className="w-full rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800">Allow Access</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

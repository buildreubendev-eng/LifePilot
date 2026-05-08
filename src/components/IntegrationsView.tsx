"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { IntegrationConnection, IntegrationStatus } from "@/lib/types";

const statusOptions: IntegrationStatus[] = ["not_connected", "connected", "paused", "error"];

export function IntegrationsView() {
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingProvider, setUpdatingProvider] = useState<string | null>(null);

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
    return () => {
      active = false;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-600">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Integrations</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Connector states are mocked, but the backend contract is real: future Gmail, Calendar, Plaid, and health integrations can plug into this surface.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total" value={integrations.length} detail="Configured connectors" />
        <MetricCard label="Connected" value={connected.length} detail="Active and syncing" />
        <MetricCard label="Errors" value={errored.length} detail="Needs attention" />
        <MetricCard label="Scopes" value={integrations.reduce((acc, i) => acc + i.permissionScopes.length, 0)} detail="Total permission scopes" />
      </div>

      {error ? <div className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{error}</div> : null}

      <Section title="Connector Readiness">
        {integrations.length === 0 ? (
          <EmptyState title="No integrations" copy="Integrations will appear when configured." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {integrations.map((integration) => (
              <div key={integration.provider} className={`rounded-lg border p-5 shadow-sm transition ${
                integration.status === "connected" ? "border-emerald-200 bg-emerald-50/20" :
                integration.status === "error" ? "border-red-200 bg-red-50/20" :
                "border-stone-200 bg-white"
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-stone-950">{integration.label}</h2>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{integration.notes}</p>
                    {integration.lastSyncAt && (
                      <p className="mt-1 text-xs text-stone-500">
                        Last sync: {new Date(integration.lastSyncAt).toLocaleString()}
                      </p>
                    )}
                    {integration.connectedAt && (
                      <p className="mt-0.5 text-xs text-stone-400">
                        Connected since: {new Date(integration.connectedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    integration.status === "connected" ? "bg-emerald-100 text-emerald-800" :
                    integration.status === "error" ? "bg-red-100 text-red-800" :
                    integration.status === "paused" ? "bg-amber-100 text-amber-800" :
                    "bg-stone-100 text-stone-700"
                  }`}>{integration.status.replaceAll("_", " ")}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {integration.permissionScopes.map((scope) => (
                    <span key={scope} className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                      {scope}
                    </span>
                  ))}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => void updateStatus(integration.provider, status)}
                      disabled={updatingProvider !== null}
                      className={`rounded-md px-3 py-2 text-sm font-semibold capitalize transition disabled:opacity-50 ${
                        integration.status === status ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
                      }`}
                    >
                      {status.replaceAll("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

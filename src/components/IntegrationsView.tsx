"use client";

import { useEffect, useState } from "react";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { IntegrationConnection, IntegrationStatus } from "@/lib/types";

const statusOptions: IntegrationStatus[] = ["not_connected", "connected", "paused", "error"];

export function IntegrationsView() {
  const [integrations, setIntegrations] = useState<IntegrationConnection[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadIntegrations() {
    const body = await fetchJson<{ integrations: IntegrationConnection[] }>("/api/life-admin/integrations");
    setIntegrations(body.integrations);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialIntegrations() {
      try {
        const body = await fetchJson<{ integrations: IntegrationConnection[] }>("/api/life-admin/integrations");
        if (active) {
          setIntegrations(body.integrations);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load integrations");
        }
      }
    }

    void loadInitialIntegrations();
    return () => {
      active = false;
    };
  }, []);

  async function updateStatus(provider: IntegrationConnection["provider"], status: IntegrationStatus) {
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
    }
  }

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Integrations</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Connector states are mocked, but the backend contract is real: future Gmail, Calendar, Plaid, and health integrations can plug into this surface.
        </p>
      </section>
      {error ? <p className="rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{error}</p> : null}
      <Section title="Connector Readiness">
        <div className="grid gap-3 md:grid-cols-2">
          {integrations.map((integration) => (
            <div key={integration.provider} className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-stone-950">{integration.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{integration.notes}</p>
                </div>
                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold capitalize text-stone-700">{integration.status.replaceAll("_", " ")}</span>
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
                    className={`rounded-md px-3 py-2 text-sm font-semibold capitalize ${
                      integration.status === status ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200"
                    }`}
                  >
                    {status.replaceAll("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

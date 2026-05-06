"use client";

import { useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { IngestionRun, LifeAdminMessage, RawMessageProvider } from "@/lib/types";

const providers: RawMessageProvider[] = ["gmail", "google-calendar", "plaid", "health", "manual"];

export function IngestView() {
  const [provider, setProvider] = useState<RawMessageProvider>("gmail");
  const [sender, setSender] = useState("Northstar Card Services");
  const [subject, setSubject] = useState("Credit card bill due May 12");
  const [body, setBody] = useState("Your statement balance is $342.19 and payment is due May 12.");
  const [createdItems, setCreatedItems] = useState<LifeAdminMessage[]>([]);
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadRuns() {
    const response = await fetchJson<{ runs: IngestionRun[] }>("/api/life-admin/ingest/runs");
    setRuns(response.runs);
  }

  useEffect(() => {
    let active = true;

    async function loadInitialRuns() {
      try {
        const response = await fetchJson<{ runs: IngestionRun[] }>("/api/life-admin/ingest/runs");
        if (active) {
          setRuns(response.runs);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load ingestion runs");
        }
      }
    }

    void loadInitialRuns();
    return () => {
      active = false;
    };
  }, []);

  async function ingest() {
    try {
      const response = await fetchJson<{ run: IngestionRun; items: LifeAdminMessage[] }>("/api/life-admin/ingest", {
        method: "POST",
        body: JSON.stringify({
          provider,
          messages: [
            {
              source: provider === "google-calendar" ? "Calendar" : provider === "plaid" ? "Bank alert" : provider === "health" ? "Portal" : "Gmail",
              sender,
              subject,
              body,
              receivedAt: new Date().toISOString(),
            },
          ],
          notes: "Manual MVP ingestion test",
        }),
      });
      setCreatedItems(response.items);
      await loadRuns();
      setError(null);
    } catch (ingestError) {
      setError(ingestError instanceof Error ? ingestError.message : "Unable to ingest message");
    }
  }

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Ingest</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Submit raw provider messages and let the backend normalize them into life-admin items. This is the bridge future connectors will use.
        </p>
      </section>

      <Section title="Raw Message Simulator">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Provider
              <select value={provider} onChange={(event) => setProvider(event.target.value as RawMessageProvider)} className="rounded-md border border-stone-300 bg-white px-3 py-2">
                {providers.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Sender
              <input value={sender} onChange={(event) => setSender(event.target.value)} className="rounded-md border border-stone-300 px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Subject
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-md border border-stone-300 px-3 py-2" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700 md:row-span-2">
              Body
              <textarea value={body} onChange={(event) => setBody(event.target.value)} className="min-h-28 rounded-md border border-stone-300 px-3 py-2" />
            </label>
          </div>
          <button type="button" onClick={() => void ingest()} className="mt-4 rounded-md bg-stone-900 px-4 py-3 text-sm font-semibold text-white">
            Ingest Message
          </button>
          {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      </Section>

      {createdItems.length > 0 ? (
        <Section title="Created Items">
          <div className="grid gap-3 lg:grid-cols-2">
            {createdItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </Section>
      ) : null}

      <Section title="Ingestion Runs">
        <div className="grid gap-3">
          {runs.map((run) => (
            <div key={run.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">{run.provider}</p>
                  <h3 className="mt-1 text-base font-bold text-stone-950">{run.inputCount} message(s) ingested</h3>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{run.status}</span>
              </div>
              <p className="mt-2 text-sm text-stone-600">{run.createdItemIds.join(", ")}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

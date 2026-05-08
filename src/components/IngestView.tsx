"use client";

import { useCallback, useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { IngestionRun, LifeAdminMessage, RawMessageProvider } from "@/lib/types";

const providers: RawMessageProvider[] = ["gmail", "google-calendar", "plaid", "health", "manual"];

const providerLabels: Record<RawMessageProvider, string> = {
  "gmail": "Gmail",
  "google-calendar": "Google Calendar",
  "plaid": "Plaid",
  "health": "Health Portal",
  "manual": "Manual Entry",
};

export function IngestView() {
  const [provider, setProvider] = useState<RawMessageProvider>("gmail");
  const [sender, setSender] = useState("Northstar Card Services");
  const [subject, setSubject] = useState("Credit card bill due May 12");
  const [body, setBody] = useState("Your statement balance is $342.19 and payment is due May 12.");
  const [createdItems, setCreatedItems] = useState<LifeAdminMessage[]>([]);
  const [runs, setRuns] = useState<IngestionRun[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadRuns = useCallback(async () => {
    const response = await fetchJson<{ runs: IngestionRun[] }>("/api/life-admin/ingest/runs");
    setRuns(response.runs);
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        await loadRuns();
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load ingestion runs");
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
  }, [loadRuns]);

  async function ingest() {
    if (!sender.trim() || !subject.trim() || !body.trim()) {
      setError("Sender, subject, and body are all required.");
      return;
    }

    setIsIngesting(true);
    setError(null);
    setSuccessMessage(null);
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
          notes: `Manual ingestion via ${providerLabels[provider]}`,
        }),
      });
      setCreatedItems(response.items);
      await loadRuns();
      setError(null);
      setSuccessMessage(`Successfully ingested ${response.items.length} item(s) via ${providerLabels[provider]}.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (ingestError) {
      setError(ingestError instanceof Error ? ingestError.message : "Unable to ingest message");
    } finally {
      setIsIngesting(false);
    }
  }

  const totalIngested = runs.reduce((acc, r) => acc + r.inputCount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-600">Loading ingestion data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Ingest</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Submit raw provider messages and let the backend normalize them into life-admin items. This is the bridge future connectors will use.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Runs" value={runs.length} detail="Total ingestion batches" />
        <MetricCard label="Messages" value={totalIngested} detail="Total messages processed" />
        <MetricCard label="Items Created" value={createdItems.length} detail="From latest ingestion" />
      </div>

      {successMessage ? <div className="mt-4 rounded-md bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">{successMessage}</div> : null}
      {error ? <div className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{error}</div> : null}

      <Section title="Raw Message Simulator">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Provider
              <select value={provider} onChange={(event) => setProvider(event.target.value as RawMessageProvider)} className="rounded-md border border-stone-300 bg-white px-3 py-2">
                {providers.map((option) => (
                  <option key={option} value={option}>
                    {providerLabels[option]}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Sender
              <input value={sender} onChange={(event) => setSender(event.target.value)} className="rounded-md border border-stone-300 px-3 py-2" placeholder="e.g. Bank of America" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700">
              Subject
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className="rounded-md border border-stone-300 px-3 py-2" placeholder="e.g. Your bill is due" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-stone-700 md:row-span-2">
              Body
              <textarea value={body} onChange={(event) => setBody(event.target.value)} className="min-h-28 rounded-md border border-stone-300 px-3 py-2" placeholder="Paste the full message body..." />
            </label>
          </div>
          <button
            type="button"
            onClick={() => void ingest()}
            disabled={isIngesting}
            className="mt-4 rounded-md bg-stone-900 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {isIngesting ? "Ingesting..." : "Ingest Message"}
          </button>
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
        {runs.length === 0 ? (
          <EmptyState title="No ingestion runs" copy="Submit a message above to create the first ingestion run." />
        ) : (
          <div className="grid gap-3">
            {runs.map((run) => (
              <div key={run.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold uppercase tracking-wide text-stone-500">{providerLabels[run.provider as RawMessageProvider] || run.provider}</p>
                      {run.notes && <span className="text-xs text-stone-400">— {run.notes}</span>}
                    </div>
                    <h3 className="mt-1 text-base font-bold text-stone-950">{run.inputCount} message(s) ingested</h3>
                    <p className="mt-1 text-xs text-stone-500">Started: {new Date(run.startedAt).toLocaleString()}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    run.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                    run.status === "failed" ? "bg-red-100 text-red-800" :
                    "bg-amber-100 text-amber-800"
                  }`}>{run.status}</span>
                </div>
                {run.createdItemIds.length > 0 && (
                  <p className="mt-2 text-sm text-stone-600">
                    Items: {run.createdItemIds.map((id) => id.slice(0, 8)).join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

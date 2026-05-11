"use client";

import { useCallback, useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { IngestionRun, LifeAdminMessage, RawMessageProvider } from "@/lib/types";
import {
  Mail,
  Calendar,
  DollarSign,
  Heart,
  PenTool,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Zap,
  ArrowRight,
  Eye,
} from "lucide-react";
import { GenericSkeleton } from "@/components/Skeleton";

const providers: RawMessageProvider[] = ["gmail", "google-calendar", "plaid", "health", "manual"];

const providerConfig: Record<RawMessageProvider, { label: string; icon: React.ReactNode; color: string; borderColor: string }> = {
  gmail: { label: "Gmail", icon: <Mail size={16} />, color: "text-red-400", borderColor: "border-red-500/20" },
  "google-calendar": { label: "Google Calendar", icon: <Calendar size={16} />, color: "text-blue-400", borderColor: "border-blue-500/20" },
  plaid: { label: "Plaid", icon: <DollarSign size={16} />, color: "text-emerald-400", borderColor: "border-emerald-500/20" },
  health: { label: "Health Portal", icon: <Heart size={16} />, color: "text-rose-400", borderColor: "border-rose-500/20" },
  manual: { label: "Manual Entry", icon: <PenTool size={16} />, color: "text-violet-400", borderColor: "border-violet-500/20" },
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
  const [notice, setNotice] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const loadRuns = useCallback(async () => {
    const response = await fetchJson<{ runs: IngestionRun[] }>("/api/life-admin/ingest/runs");
    setRuns(response.runs);
  }, []);

  useEffect(() => {
    let active = true;
    async function init() {
      try { await loadRuns(); }
      catch (loadError) { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load ingestion runs"); }
      finally { if (active) setIsLoading(false); }
    }
    void init();
    return () => { active = false; };
  }, [loadRuns]);

  async function ingest() {
    if (!sender.trim() || !subject.trim() || !body.trim()) {
      setError("Sender, subject, and body are all required.");
      return;
    }
    setIsIngesting(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetchJson<{ run: IngestionRun; items: LifeAdminMessage[] }>("/api/life-admin/ingest", {
        method: "POST",
        body: JSON.stringify({
          provider,
          messages: [{
            source: provider === "google-calendar" ? "Calendar" : provider === "plaid" ? "Bank alert" : provider === "health" ? "Portal" : "Gmail",
            sender, subject, body,
            receivedAt: new Date().toISOString(),
          }],
          notes: `Manual ingestion via ${providerConfig[provider].label}`,
        }),
      });
      setCreatedItems(response.items);
      await loadRuns();
      setNotice(`Successfully ingested ${response.items.length} item(s) via ${providerConfig[provider].label}.`);
      setShowPreview(false);
      setTimeout(() => setNotice(null), 5000);
    } catch (ingestError) {
      setError(ingestError instanceof Error ? ingestError.message : "Unable to ingest message");
    } finally {
      setIsIngesting(false);
    }
  }

  const totalIngested = runs.reduce((acc, r) => acc + r.inputCount, 0);
  const totalCreated = runs.reduce((acc, r) => acc + r.createdItemIds.length, 0);
  const failedRuns = runs.filter((r) => r.status === "failed").length;

  if (isLoading) {
    return <GenericSkeleton />;
  }

  return (
    <div className="animate-fade-in pb-20">
      <section className="py-4 mb-8">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Ingestion Pipeline</h1>
        <p className="mt-3 max-w-3xl text-lg font-light leading-7 text-stone-400">
          Submit raw provider messages and preview how PLOS normalizes them into actionable life-admin items.
        </p>
      </section>

      {error && <div className="mb-6 rounded-lg bg-red-950/50 border border-red-500/30 px-4 py-3 text-sm font-medium text-red-200">{error}</div>}
      {notice && <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-4 py-3 text-sm font-medium text-emerald-200">{notice}</div>}

      {/* Metrics */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-10">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><Upload size={18} className="text-blue-400" /></div>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{runs.length}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">Ingestion Runs</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><FileText size={18} className="text-emerald-400" /></div>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{totalIngested}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">Messages Processed</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 rounded-lg bg-violet-500/10"><Zap size={18} className="text-violet-400" /></div>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{totalCreated}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">Items Created</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${failedRuns > 0 ? "bg-red-500/10" : "bg-emerald-500/10"}`}>
              {failedRuns > 0 ? <AlertTriangle size={18} className="text-red-400" /> : <CheckCircle2 size={18} className="text-emerald-400" />}
            </div>
          </div>
          <p className="text-2xl font-extrabold text-white tabular-nums">{failedRuns}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mt-1">Failed Runs</p>
        </div>
      </div>

      {/* Raw Message Simulator */}
      <Section title="Raw Message Simulator">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-6 shadow-lg backdrop-blur-md">
          {/* Provider selector as pill buttons */}
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Source Provider</p>
            <div className="flex flex-wrap gap-2">
              {providers.map((p) => {
                const config = providerConfig[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setProvider(p)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                      provider === p
                        ? `bg-white/10 text-white border-white/20 shadow-lg`
                        : `bg-white/[0.02] text-stone-400 ${config.borderColor} hover:bg-white/5 hover:text-white`
                    }`}
                  >
                    <span className={provider === p ? "text-white" : config.color}>{config.icon}</span>
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
              Sender
              <input
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. Bank of America"
                className="rounded-xl border border-white/10 bg-black/60 px-3 py-3 text-sm text-white outline-none placeholder:text-stone-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
              />
            </label>
            <label className="grid gap-2 text-xs font-bold uppercase tracking-widest text-stone-500">
              Subject
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Your bill is due"
                className="rounded-xl border border-white/10 bg-black/60 px-3 py-3 text-sm text-white outline-none placeholder:text-stone-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
              />
            </label>
            <label className="grid gap-2 text-xs font-bold uppercase tracking-widest text-stone-500 md:col-span-2">
              Body
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Paste the full message body..."
                className="min-h-28 rounded-xl border border-white/10 bg-black/60 px-3 py-3 text-sm text-white outline-none placeholder:text-stone-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 resize-y"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-stone-300 transition-all hover:bg-white/10 hover:text-white"
            >
              <Eye size={16} />
              Preview Extraction
            </button>
            <button
              type="button"
              onClick={() => void ingest()}
              disabled={isIngesting}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-500 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isIngesting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <Upload size={16} />
              )}
              {isIngesting ? "Ingesting..." : "Ingest Message"}
            </button>
          </div>

          {/* Extraction Preview */}
          {showPreview && (
            <div className="mt-5 animate-slide-up rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Eye size={14} className="text-indigo-400" />
                <h4 className="text-sm font-bold text-indigo-300">Extraction Preview</h4>
              </div>
              <p className="text-xs text-stone-400 mb-4">
                The following shows how PLOS would process this message. The actual extraction happens server-side.
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-white/5 bg-black/30 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Input</p>
                  <div className="grid gap-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-stone-500">Provider</span><span className="text-white font-semibold">{providerConfig[provider].label}</span></div>
                    <div className="flex justify-between"><span className="text-stone-500">Sender</span><span className="text-white font-semibold truncate ml-4">{sender || "—"}</span></div>
                    <div className="flex justify-between"><span className="text-stone-500">Subject</span><span className="text-white font-semibold truncate ml-4">{subject || "—"}</span></div>
                  </div>
                </div>
                <div className="rounded-lg border border-white/5 bg-black/30 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Expected Output</p>
                  <div className="grid gap-1.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <ArrowRight size={10} className="text-emerald-400" />
                      <span className="text-stone-400">Categorized inbox item with extracted fields</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowRight size={10} className="text-emerald-400" />
                      <span className="text-stone-400">Priority score based on due date and financial impact</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ArrowRight size={10} className="text-emerald-400" />
                      <span className="text-stone-400">Suggested next action for executive review</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Created Items */}
      {createdItems.length > 0 && (
        <Section title="Created Items">
          <div className="grid gap-4 lg:grid-cols-2 stagger-children">
            {createdItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </Section>
      )}

      {/* Ingestion Run History */}
      <Section title={`Run History (${runs.length})`}>
        {runs.length === 0 ? (
          <EmptyState title="No ingestion runs" copy="Submit a message above to create the first ingestion run." icon="inbox" />
        ) : (
          <div className="grid gap-4 stagger-children">
            {runs.map((run) => {
              const config = providerConfig[run.provider as RawMessageProvider];
              const isSuccess = run.status === "completed";
              const isFailed = run.status === "failed";

              return (
                <div
                  key={run.id}
                  className={`rounded-2xl border p-5 shadow-lg backdrop-blur-md transition-all ${
                    isSuccess ? "bg-black/40 border-emerald-500/10" :
                    isFailed ? "bg-red-950/10 border-red-500/20" :
                    "bg-black/40 border-amber-500/20"
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/30 border border-white/5 ${config?.color ?? "text-stone-400"}`}>
                        {config?.icon ?? <Upload size={16} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold text-white">{config?.label ?? run.provider}</h3>
                          {run.notes && <span className="text-xs text-stone-500">— {run.notes}</span>}
                        </div>
                        <p className="text-xs text-stone-400">
                          {run.inputCount} message(s) → {run.createdItemIds.length} item(s) created
                          {run.duplicateCount > 0 && `, ${run.duplicateCount} duplicates`}
                          {run.failedCount > 0 && `, ${run.failedCount} failed`}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-stone-500">
                          <span className="flex items-center gap-1"><Clock size={10} />{new Date(run.startedAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold ${
                      isSuccess ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      isFailed ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {isSuccess ? <CheckCircle2 size={12} /> : isFailed ? <XCircle size={12} /> : <AlertTriangle size={12} />}
                      {run.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}

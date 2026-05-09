"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { Section } from "@/components/Section";
import type { LifeAdminCategory, LifeAdminStatus } from "@/lib/types";
import { usePlosStore } from "@/lib/usePlosStore";

type StatusFilter = LifeAdminStatus | "all";

export function InboxView() {
  const { items, isLoading, error, setItemStatus, resetStatuses } = usePlosStore();
  const [category, setCategory] = useState<LifeAdminCategory | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleToggleBatchMode = () => {
    setIsBatchMode(!isBatchMode);
    setSelectedIds(new Set());
  };

  const handleToggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBatchStatus = async (nextStatus: LifeAdminStatus) => {
    setBatchProcessing(true);
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await setItemStatus(id, nextStatus);
    }
    setBatchProcessing(false);
    setIsBatchMode(false);
    setSelectedIds(new Set());
    setNotice(`Updated ${ids.length} item${ids.length === 1 ? "" : "s"} to ${nextStatus}.`);
    window.setTimeout(() => setNotice(null), 3500);
  };

  const handleSelectVisible = () => {
    setSelectedIds(new Set(filtered.map((item) => item.id)));
  };

  const handleClearFilters = () => {
    setCategory("all");
    setStatus("all");
    setQuery("");
    setSelectedIds(new Set());
  };

  const handleResetDemoData = async () => {
    const ok = await resetStatuses();
    setSelectedIds(new Set());
    setNotice(ok ? "Demo data reset." : "Reset attempted. Check the error message above.");
    window.setTimeout(() => setNotice(null), 3500);
  };

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = items.filter((item) => {
    const categoryMatch = category === "all" || item.category === category;
    const statusMatch = status === "all" || item.status === status;
    const queryMatch =
      !normalizedQuery ||
      [item.title, item.sender, item.source, item.suggestedAction, item.originalMessage]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery);

    return categoryMatch && statusMatch && queryMatch;
  });

  const statusOptions: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "new", label: "New" },
    { value: "reviewed", label: "Reviewed" },
    { value: "completed", label: "Completed" },
    { value: "ignored", label: "Ignored" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-600">Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-4xl font-black text-stone-950">AI Inbox</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
              Parsed life-admin items from realistic mock messages. Search, filter, and batch triage before future email and calendar integrations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleResetDemoData()}
            className="w-fit rounded-md bg-white px-3 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-200 transition hover:bg-stone-50"
          >
            Reset Demo Data
          </button>
        </div>
      </section>
      {error ? <div className="mb-4 rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{error}</div> : null}
      {notice ? <div className="mb-4 rounded-md bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">{notice}</div> : null}
      <div className="mb-4 grid gap-4 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="grid gap-1.5">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Search inbox</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, sender, source, action, or message..."
            className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Category</span>
            <CategoryFilter value={category} onChange={setCategory} compact />
          </div>
          <div className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Status</span>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`rounded-md px-2.5 py-1.5 text-xs font-bold transition ${
                    status === option.value
                      ? "bg-stone-900 text-white"
                      : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              {(category !== "all" || status !== "all" || query) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-md px-2.5 py-1.5 text-xs font-bold text-stone-500 ring-1 ring-stone-200 transition hover:bg-stone-50"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <Section
        title={`Parsed Items (${filtered.length})`}
        action={
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex gap-2">
              <Badge variant="new">{items.filter((item) => item.status === "new").length} new</Badge>
              <Badge variant="reviewed">{items.filter((item) => item.status === "reviewed").length} reviewed</Badge>
            </div>
            <button
              onClick={handleToggleBatchMode}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${isBatchMode ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"}`}
            >
              {isBatchMode ? "Cancel Batch" : "Batch Triage"}
            </button>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState title="Inbox zero!" copy="Your life admin is all caught up." icon="success" />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 stagger-children">
            {filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                selectable={isBatchMode}
                selected={selectedIds.has(item.id)}
                onToggle={() => handleToggleItem(item.id)}
              />
            ))}
          </div>
        )}
      </Section>
      {isBatchMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-full bg-stone-900 px-6 py-3 text-white shadow-xl z-50">
          <span className="text-sm font-semibold">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-stone-700" />
          <button
            onClick={() => void handleBatchStatus("reviewed")}
            disabled={batchProcessing}
            className="text-sm font-bold text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
          >
            {batchProcessing ? "Processing..." : "Review"}
          </button>
          <button
            onClick={() => void handleBatchStatus("completed")}
            disabled={batchProcessing}
            className="text-sm font-bold text-blue-300 hover:text-blue-200 disabled:opacity-50"
          >
            Complete
          </button>
          <button
            onClick={() => void handleBatchStatus("ignored")}
            disabled={batchProcessing}
            className="text-sm font-bold text-stone-300 hover:text-white disabled:opacity-50"
          >
            Ignore
          </button>
        </div>
      )}
      {isBatchMode && selectedIds.size === 0 && filtered.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full bg-white px-6 py-3 text-stone-800 shadow-xl ring-1 ring-stone-200">
          <span className="text-sm font-semibold">Batch mode</span>
          <div className="h-4 w-px bg-stone-200" />
          <button
            type="button"
            onClick={handleSelectVisible}
            className="text-sm font-bold text-emerald-700 hover:text-emerald-600"
          >
            Select {filtered.length} visible
          </button>
        </div>
      )}
    </div>
  );
}

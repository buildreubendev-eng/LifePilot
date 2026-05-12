"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { Section } from "@/components/Section";
import type { LifeAdminCategory, LifeAdminStatus } from "@/lib/types";
import { usePlosStore } from "@/lib/usePlosStore";
import { RefreshCw, Search } from 'lucide-react';
import { InboxSkeleton } from '@/components/Skeleton';
import { useToast } from '@/components/ToastProvider';

type StatusFilter = LifeAdminStatus | "all";

export function InboxView() {
  const { items, isLoading, error, setItemStatus, resetStatuses } = usePlosStore();
  const [category, setCategory] = useState<LifeAdminCategory | "all">("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);
  const { addToast } = useToast();

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
    addToast(`Updated ${ids.length} item${ids.length === 1 ? "" : "s"} to ${nextStatus}.`, "success");
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
    addToast(ok ? "Demo data reset." : "Reset attempted.", ok ? "success" : "warning");
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
    return <InboxSkeleton />;
  }

  return (
    <div className="animate-fade-in pb-20">
      <section className="py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">AI Inbox</h1>
            <p className="mt-3 max-w-3xl text-lg font-light leading-7 text-stone-400">
              Parsed life-admin items from connected communication channels. Secure triage environment.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleResetDemoData()}
            className="flex items-center gap-2 w-fit rounded-full bg-white/5 border border-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 hover:border-white/20"
          >
            <RefreshCw size={14} />
            Reset Data
          </button>
        </div>
      </section>

      {error ? <div className="mb-6 rounded-lg bg-red-950/50 border border-red-500/30 px-4 py-3 text-sm font-medium text-red-200">{error}</div> : null}
      
      <div className="mb-8 grid gap-5 rounded-2xl border border-white/5 bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
        <label className="grid gap-2 relative">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Search inbox</span>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, sender, source, action..."
              className="w-full rounded-xl border border-white/10 bg-black/60 pl-10 pr-4 py-3 text-sm text-white outline-none transition placeholder:text-stone-600 focus:border-emerald-500/50 focus:bg-black focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
        </label>
        
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Category</span>
            <CategoryFilter value={category} onChange={setCategory} compact />
          </div>
          <div className="grid gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500">Status</span>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                    status === option.value
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                      : "bg-white/5 border border-white/5 text-stone-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
              {(category !== "all" || status !== "all" || query) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="rounded-lg px-3 py-2 text-xs font-bold text-stone-500 border border-white/10 transition hover:bg-white/5 hover:text-stone-300"
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
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${isBatchMode ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "bg-white/5 text-stone-300 border border-white/10 hover:bg-white/10 hover:text-white"}`}
            >
              {isBatchMode ? "Cancel Batch" : "Batch Triage"}
            </button>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState title="Inbox zero!" copy="Your life admin is all caught up." icon="success" />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 stagger-children">
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
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/30 backdrop-blur-xl px-5 py-3 text-white shadow-2xl z-50 mx-4 max-w-[calc(100vw-2rem)]">
          <span className="text-sm font-semibold tracking-wide">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-emerald-500/30" />
          <button
            onClick={() => void handleBatchStatus("reviewed")}
            disabled={batchProcessing}
            className="text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-50"
          >
            {batchProcessing ? "Processing..." : "Review"}
          </button>
          <button
            onClick={() => void handleBatchStatus("completed")}
            disabled={batchProcessing}
            className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
          >
            Complete
          </button>
          <button
            onClick={() => void handleBatchStatus("ignored")}
            disabled={batchProcessing}
            className="text-sm font-bold text-stone-400 hover:text-stone-300 transition-colors disabled:opacity-50"
          >
            Ignore
          </button>
        </div>
      )}
      
      {isBatchMode && selectedIds.size === 0 && filtered.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 z-50 flex flex-wrap -translate-x-1/2 items-center justify-center gap-3 rounded-2xl bg-black/80 backdrop-blur-xl px-5 py-3 text-stone-300 shadow-2xl border border-white/10 mx-4 max-w-[calc(100vw-2rem)]">
          <span className="text-sm font-semibold">Batch mode active</span>
          <div className="h-4 w-px bg-white/10" />
          <button
            type="button"
            onClick={handleSelectVisible}
            className="text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            Select {filtered.length} visible
          </button>
        </div>
      )}
    </div>
  );
}

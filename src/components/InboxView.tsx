"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { CategoryFilter } from "@/components/CategoryFilter";
import { EmptyState } from "@/components/EmptyState";
import { ItemCard } from "@/components/ItemCard";
import { Section } from "@/components/Section";
import type { LifeAdminCategory } from "@/lib/types";
import { usePlosStore } from "@/lib/usePlosStore";

export function InboxView() {
  const { items, setItemStatus } = usePlosStore();
  const [category, setCategory] = useState<LifeAdminCategory | "all">("all");
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const handleBatchMarkReviewed = () => {
    selectedIds.forEach((id) => setItemStatus(id, "reviewed"));
    setIsBatchMode(false);
    setSelectedIds(new Set());
  };
  const filtered = useMemo(() => (category === "all" ? items : items.filter((item) => item.category === category)), [category, items]);

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">AI Inbox</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Parsed life-admin items from realistic mock messages. These are ready for review before future email and calendar integrations.
        </p>
      </section>
      <CategoryFilter value={category} onChange={setCategory} />
      <Section
        title="Parsed Items"
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
          <EmptyState title="Inbox zero!" copy="Your life admin is all caught up." />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
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
          <button onClick={handleBatchMarkReviewed} className="text-sm font-bold text-emerald-400 hover:text-emerald-300">Mark Reviewed</button>
        </div>
      )}
    </div>
  );
}

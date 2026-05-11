"use client";

import { useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { DocumentRecord, LifeAdminCategory } from "@/lib/types";
import { usePlosStore } from "@/lib/usePlosStore";
import { GenericSkeleton } from "@/components/Skeleton";

const categoryColors: Record<string, string> = {
  bill: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  renewal: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  appointment: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  travel: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  medical: "bg-red-500/10 text-red-400 border-red-500/20",
  insurance: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  subscription: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  receipt: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "school/family": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "tax/document": "bg-slate-500/10 text-slate-400 border-slate-500/20",
  "personal reply": "bg-pink-500/10 text-pink-400 border-pink-500/20",
};

const sourceIcons: Record<string, React.ReactNode> = {
  Gmail: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  "Bank alert": (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Portal: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500">
      <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
    </svg>
  ),
  Calendar: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
};

export function DocumentsView() {
  const { items, isLoading: itemsLoading } = usePlosStore();
  const [savedDocuments, setSavedDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<LifeAdminCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "category">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const documents = items.filter((item) => item.documentSaveRecommended);

  const uniqueCategories: LifeAdminCategory[] = [
    ...new Set([
      ...savedDocuments.map((d) => d.category),
      ...documents.map((d) => d.category),
    ]),
  ];

  // Apply filters and search
  const filteredSaved = savedDocuments
    .filter((doc) =>
      (categoryFilter === "all" || doc.category === categoryFilter) &&
      (doc.title.toLowerCase().includes(search.toLowerCase()) || doc.category.toLowerCase().includes(search.toLowerCase())),
    )
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      if (sortBy === "oldest") return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
      return a.category.localeCompare(b.category);
    });

  const filteredDocuments = documents.filter((doc) =>
    (categoryFilter === "all" || doc.category === categoryFilter) &&
    (doc.title.toLowerCase().includes(search.toLowerCase()) || doc.category.toLowerCase().includes(search.toLowerCase())),
  );

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      try {
        const body = await fetchJson<{ documents: DocumentRecord[] }>("/api/life-admin/documents");
        if (active) {
          setSavedDocuments(body.documents);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load documents");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadDocuments();
    return () => {
      active = false;
    };
  }, []);

  if (isLoading || itemsLoading) {
    return <GenericSkeleton />;
  }

  return (
    <div className="animate-fade-in">
      <section className="py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Document Vault</h1>
            <p className="mt-3 max-w-3xl text-lg font-light leading-7 text-stone-400">
              Receipts, confirmations, forms, and tax records that PLOS recommends saving. Search, filter, and organize your important documents.
            </p>
          </div>
          {/* View mode toggle */}
          <div className="shrink-0 flex items-center gap-1 rounded-lg bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-md p-2 transition ${viewMode === "grid" ? "bg-black/40 shadow-sm text-white" : "text-stone-400 hover:text-stone-400"}`}
              aria-label="Grid view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-md p-2 transition ${viewMode === "list" ? "bg-black/40 shadow-sm text-white" : "text-stone-400 hover:text-stone-400"}`}
              aria-label="List view"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search and filters */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Search vault..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/60 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-stone-600 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rounded-xl border border-white/10 bg-black/60 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="category">By category</option>
          </select>
        </div>

        {/* Category filter chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              categoryFilter === "all" ? "bg-emerald-600 text-white" : "bg-black/40 text-stone-400 ring-1 border border-white/10 hover:bg-black/20"
            }`}
          >
            All ({savedDocuments.length + documents.length})
          </button>
          {uniqueCategories.map((cat) => {
            const count = savedDocuments.filter((d) => d.category === cat).length +
              documents.filter((d) => d.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition ${
                  categoryFilter === cat
                    ? "bg-emerald-600 text-white"
                    : `${categoryColors[cat] ?? "bg-white/5 text-stone-300"} ring-1 border border-white/10 hover:shadow-sm`
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 stagger-children">
        <MetricCard label="Saved" value={savedDocuments.length} detail="Records in your vault" accent="success" />
        <MetricCard label="Pending" value={documents.length} detail="Recommended for saving" accent={documents.length > 0 ? "warning" : "default"} />
        <MetricCard label="Categories" value={uniqueCategories.length} detail="Unique document types" />
        <MetricCard
          label="Sources"
          value={new Set([...savedDocuments.map((d) => d.source), ...documents.map((d) => d.source)]).size}
          detail="Different providers"
        />
      </div>

      {error ? <div className="mt-4 rounded-lg bg-red-950/50 border border-red-500/30 px-4 py-3 text-sm font-medium text-red-200">{error}</div> : null}

      <Section title="Saved Records">
        {filteredSaved.length === 0 ? (
          <EmptyState
            title={savedDocuments.length === 0 ? "No documents saved yet" : "No matches"}
            copy={savedDocuments.length === 0 ? "Use Save Document from an inbox detail page to populate this list." : `No saved documents match your filters.`}
            icon={savedDocuments.length === 0 ? "documents" : "search"}
            actionLabel={savedDocuments.length === 0 ? "Go to Inbox" : undefined}
            actionHref={savedDocuments.length === 0 ? "/inbox" : undefined}
          />
        ) : (
          <div className={viewMode === "grid" ? "grid gap-3 lg:grid-cols-2 stagger-children" : "grid gap-2 stagger-children"}>
            {filteredSaved.map((document) => (
              <div
                key={document.id}
                className={`rounded-xl border bg-black/40 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  document.status === "saved" ? "border-white/10" :
                  document.status === "archived" ? "border-white/5 opacity-75" :
                  "border-amber-200"
                } ${viewMode === "list" ? "p-3" : "p-4"}`}
              >
                <div className={`flex ${viewMode === "list" ? "items-center gap-4" : "flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"}`}>
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-lg ${categoryColors[document.category] ?? "bg-white/5"}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                        <polyline points="14,2 14,8 20,8" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold capitalize ${categoryColors[document.category] ?? "bg-white/5 text-stone-300"}`}>
                          {document.category}
                        </span>
                        {sourceIcons[document.source] && (
                          <span className="flex items-center gap-1 text-[10px] text-stone-400">
                            {sourceIcons[document.source]}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-1 text-sm font-bold text-white truncate">{document.title}</h3>
                      <p className="mt-0.5 text-xs text-stone-400">
                        Saved {new Date(document.savedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    document.status === "saved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    document.status === "archived" ? "bg-white/5 text-stone-500 border border-white/10" :
                    "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>{document.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Save Queue">
        {filteredDocuments.length === 0 ? (
          <EmptyState title="No documents found" copy={search || categoryFilter !== "all" ? "No documents match your filters." : "No documents need saving right now."} icon={search ? "search" : "documents"} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2 stagger-children">
            {filteredDocuments.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

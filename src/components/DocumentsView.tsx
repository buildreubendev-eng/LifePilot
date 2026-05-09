"use client";

import { useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { DocumentRecord } from "@/lib/types";
import { usePlosStore } from "@/lib/usePlosStore";

export function DocumentsView() {
  const { items, isLoading: itemsLoading } = usePlosStore();
  const [savedDocuments, setSavedDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const documents = items.filter((item) => item.documentSaveRecommended);

  // Apply search to both save-queue and saved records
  const filteredDocuments = documents.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase()) || doc.category.toLowerCase().includes(search.toLowerCase()),
  );
  const filteredSaved = savedDocuments.filter((doc) =>
    doc.title.toLowerCase().includes(search.toLowerCase()) || doc.category.toLowerCase().includes(search.toLowerCase()),
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Document Vault</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Receipts, confirmations, forms, and tax records that PLOS recommends saving.
        </p>
        <div className="mt-6 max-w-md">
          <input
            type="search"
            placeholder="Search documents by title or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-4 py-2 text-sm placeholder:text-stone-400 focus:border-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
          />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Saved" value={savedDocuments.length} detail="Records in your vault" />
        <MetricCard label="Pending" value={documents.length} detail="Recommended for saving" />
        <MetricCard label="Categories" value={new Set(savedDocuments.map((d) => d.category)).size || 0} detail="Unique document types" />
      </div>

      {error ? <div className="mt-4 rounded-md bg-red-100 px-3 py-2 text-sm font-semibold text-red-800">{error}</div> : null}

      <Section title="Saved Records">
        {filteredSaved.length === 0 ? (
          <EmptyState
            title={savedDocuments.length === 0 ? "No documents saved yet" : "No matches"}
            copy={savedDocuments.length === 0 ? "Use Save Document from an inbox detail page to populate this list." : `No saved documents match "${search}".`}
            icon={savedDocuments.length === 0 ? "documents" : "search"}
            actionLabel={savedDocuments.length === 0 ? "Go to Inbox" : undefined}
            actionHref={savedDocuments.length === 0 ? "/inbox" : undefined}
          />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredSaved.map((document) => (
              <div key={document.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{document.category}</p>
                    <h3 className="mt-2 text-base font-bold text-stone-950">{document.title}</h3>
                    <p className="mt-2 text-sm text-stone-600">
                      Saved {new Date(document.savedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })} from {document.source}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    document.status === "saved" ? "bg-emerald-100 text-emerald-800" :
                    document.status === "archived" ? "bg-stone-200 text-stone-700" :
                    "bg-amber-100 text-amber-800"
                  }`}>{document.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
      <Section title="Save Queue">
        {filteredDocuments.length === 0 ? (
          <EmptyState title="No documents found" copy={search ? `No documents match "${search}"` : "No documents need saving right now."} icon={search ? "search" : "documents"} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {filteredDocuments.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

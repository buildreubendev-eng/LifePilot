"use client";

import { useEffect, useState } from "react";
import { ItemCard } from "@/components/ItemCard";
import { EmptyState } from "@/components/EmptyState";
import { Section } from "@/components/Section";
import { fetchJson } from "@/lib/apiClient";
import type { DocumentRecord } from "@/lib/types";
import { usePlosStore } from "@/lib/usePlosStore";

export function DocumentsView() {
  const { items } = usePlosStore();
  const [savedDocuments, setSavedDocuments] = useState<DocumentRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const documents = items.filter((item) => item.documentSaveRecommended);
  const filteredDocuments = documents.filter((doc) => doc.title.toLowerCase().includes(search.toLowerCase()) || doc.category.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    let active = true;

    async function loadDocuments() {
      const body = await fetchJson<{ documents: DocumentRecord[] }>("/api/life-admin/documents");
      if (active) {
        setSavedDocuments(body.documents);
      }
    }

    async function loadInitialDocuments() {
      try {
        await loadDocuments();
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load documents");
        }
      }
    }

    void loadInitialDocuments();
    return () => {
      active = false;
    };
  }, []);

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
      <Section title="Saved Records">
        {savedDocuments.length === 0 ? (
          <div className="rounded-lg border border-stone-200 bg-white p-4 text-sm text-stone-600">
            No documents have been saved yet. Use Save Document from an inbox detail page to populate this list.
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {savedDocuments.map((document) => (
              <div key={document.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{document.category}</p>
                    <h3 className="mt-2 text-base font-bold text-stone-950">{document.title}</h3>
                    <p className="mt-2 text-sm text-stone-600">Saved {new Date(document.savedAt).toLocaleString()} from {document.source}</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{document.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
      </Section>
      <Section title="Save Queue">
        {filteredDocuments.length === 0 ? (
          <EmptyState title="No documents found" copy={search ? `No documents match "${search}"` : "No documents need saving right now."} />
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

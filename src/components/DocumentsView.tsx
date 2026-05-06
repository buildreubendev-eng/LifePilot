"use client";

import { ItemCard } from "@/components/ItemCard";
import { Section } from "@/components/Section";
import { usePlosStore } from "@/lib/usePlosStore";

export function DocumentsView() {
  const { items } = usePlosStore();
  const documents = items.filter((item) => item.documentSaveRecommended);

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Documents</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Receipts, confirmations, forms, and tax records that PLOS recommends saving.
        </p>
      </section>
      <Section title="Save Queue">
        <div className="grid gap-3 lg:grid-cols-2">
          {documents.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </Section>
    </div>
  );
}

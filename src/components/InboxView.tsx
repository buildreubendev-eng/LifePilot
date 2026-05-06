"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/Badge";
import { CategoryFilter } from "@/components/CategoryFilter";
import { ItemCard } from "@/components/ItemCard";
import { Section } from "@/components/Section";
import type { LifeAdminCategory } from "@/lib/types";
import { usePlosStore } from "@/lib/usePlosStore";

export function InboxView() {
  const { items } = usePlosStore();
  const [category, setCategory] = useState<LifeAdminCategory | "all">("all");
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
          <div className="flex gap-2">
            <Badge variant="new">{items.filter((item) => item.status === "new").length} new</Badge>
            <Badge variant="reviewed">{items.filter((item) => item.status === "reviewed").length} reviewed</Badge>
          </div>
        }
      >
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </Section>
    </div>
  );
}

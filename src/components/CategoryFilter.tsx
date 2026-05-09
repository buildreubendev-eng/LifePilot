"use client";

import type { LifeAdminCategory } from "@/lib/types";

export const categories: Array<LifeAdminCategory | "all"> = [
  "all",
  "bill",
  "renewal",
  "appointment",
  "travel",
  "medical",
  "insurance",
  "subscription",
  "receipt",
  "school/family",
  "tax/document",
  "personal reply",
];

export function CategoryFilter({
  value,
  onChange,
  compact = false,
}: {
  value: LifeAdminCategory | "all";
  onChange: (category: LifeAdminCategory | "all") => void;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={`whitespace-nowrap rounded-md font-semibold capitalize transition ${
            value === category ? "bg-emerald-600 text-white" : "bg-black/40 text-stone-300 ring-1 border border-white/10 hover:bg-black/20"
          } ${compact ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"}`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

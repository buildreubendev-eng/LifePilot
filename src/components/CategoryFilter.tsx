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
          className={`whitespace-nowrap rounded-lg font-semibold capitalize transition min-h-[36px] ${
            value === category ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20" : "bg-black/40 text-stone-300 border border-white/10 hover:bg-white/5 hover:text-white"
          } ${compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}


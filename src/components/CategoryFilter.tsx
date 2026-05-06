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
}: {
  value: LifeAdminCategory | "all";
  onChange: (category: LifeAdminCategory | "all") => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {categories.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onChange(category)}
          className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold capitalize transition ${
            value === category ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

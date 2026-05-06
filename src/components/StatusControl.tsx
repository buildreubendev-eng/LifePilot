"use client";

import type { LifeAdminStatus } from "@/lib/types";

const statuses: LifeAdminStatus[] = ["new", "reviewed", "completed", "ignored"];

export function StatusControl({
  value,
  onChange,
}: {
  value: LifeAdminStatus;
  onChange: (status: LifeAdminStatus) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:inline-grid sm:grid-cols-4">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onChange(status)}
          className={`rounded-md px-3 py-2 text-sm font-semibold capitalize transition ${
            value === status ? "bg-stone-900 text-white" : "bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
}

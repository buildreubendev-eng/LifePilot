"use client";

import type { LifeAdminStatus } from "@/lib/types";

const statuses: LifeAdminStatus[] = ["new", "reviewed", "completed", "ignored"];

const labelMap: Record<LifeAdminStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  completed: "Mark Complete",
  ignored: "Ignore",
};

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
            value === status ? "bg-emerald-600 text-white" : "bg-black/40 text-stone-300 ring-1 border border-white/10 hover:bg-black/20"
          }`}
        >
          {labelMap[status]}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Modal } from "./Modal";

function computeSnoozeDate(option: string): string {
  const now = new Date();
  if (option === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (option === "this_week") {
    const d = new Date(now);
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  }
  if (option === "next_week") {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }
  return option;
}

export function SnoozeModal({
  isOpen,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string) => void;
}) {
  const [customDate, setCustomDate] = useState("");

  const options = [
    { label: "Tomorrow", value: "tomorrow", detail: computeSnoozeDate("tomorrow") },
    { label: "Later this week", value: "this_week", detail: computeSnoozeDate("this_week") },
    { label: "Next week", value: "next_week", detail: computeSnoozeDate("next_week") },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Snooze Item">
      <p className="mb-5 text-sm text-stone-500">When should PLOS remind you about this item?</p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onConfirm(computeSnoozeDate(opt.value))}
            className="group flex items-center justify-between w-full rounded-lg border border-stone-200 bg-white px-4 py-3.5 text-left text-sm font-semibold text-stone-800 transition hover:border-emerald-300 hover:bg-emerald-50"
          >
            <span>{opt.label}</span>
            <span className="text-xs text-stone-400 group-hover:text-emerald-600">
              {new Date(opt.detail + "T12:00:00").toLocaleDateString("en", { month: "short", day: "numeric" })}
            </span>
          </button>
        ))}
        <div className="mt-3 flex items-center gap-2 border-t border-stone-100 pt-4">
          <div className="flex-1">
            <label htmlFor="snooze-custom-date" className="block text-xs font-semibold text-stone-500 mb-1">
              Custom date
            </label>
            <input
              id="snooze-custom-date"
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-800 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => {
              if (customDate) {
                onConfirm(customDate);
              }
            }}
            disabled={!customDate}
            className="mt-5 rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-40"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}

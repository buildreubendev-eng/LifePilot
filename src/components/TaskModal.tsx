"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import type { LifeAdminCategory, Priority } from "@/lib/types";

const categories: LifeAdminCategory[] = [
  "bill", "renewal", "appointment", "travel", "medical",
  "insurance", "subscription", "receipt", "school/family",
  "tax/document", "personal reply",
];

const priorities: Priority[] = ["low", "medium", "high", "urgent"];

const priorityStyles: Record<Priority, string> = {
  low: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  medium: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  high: "bg-orange-100 text-orange-800 ring-orange-200",
  urgent: "bg-red-100 text-red-800 ring-red-200",
};

export function TaskModal({
  isOpen,
  onClose,
  defaultTitle,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultTitle: string;
  onConfirm: (title: string, notes: string, category?: LifeAdminCategory, priority?: Priority, dueDate?: string) => void;
}) {
  const [title, setTitle] = useState(defaultTitle);
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState<LifeAdminCategory>("personal reply");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task">
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="task-title" className="block text-sm font-bold text-stone-300 mb-1.5">
            Title
          </label>
          <input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-category" className="block text-sm font-bold text-stone-300 mb-1.5">
              Category
            </label>
            <select
              id="task-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as LifeAdminCategory)}
              className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white capitalize focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-stone-300 mb-1.5">Priority</label>
            <div className="grid grid-cols-2 gap-1.5">
              {priorities.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-bold capitalize ring-1 transition ${
                    priority === p
                      ? priorityStyles[p]
                      : "bg-black/40 text-stone-400 border border-white/10 hover:bg-black/20"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="task-due-date" className="block text-sm font-bold text-stone-300 mb-1.5">
            Due date <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label htmlFor="task-notes" className="block text-sm font-bold text-stone-300 mb-1.5">
            Notes <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <textarea
            id="task-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional context..."
            rows={2}
            className="w-full rounded-lg border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-stone-400 resize-none focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-stone-400 transition hover:bg-black/20"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(title, notes, category, priority, dueDate || undefined)}
            disabled={!title.trim()}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-stone-800 disabled:opacity-40"
          >
            Create Task
          </button>
        </div>
      </div>
    </Modal>
  );
}

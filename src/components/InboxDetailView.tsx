"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { StatusControl } from "@/components/StatusControl";
import { formatDate, formatRelativeDueDate } from "@/lib/date";
import { scoreLifeAdminItem } from "@/lib/prioritization";
import { usePlosStore } from "@/lib/usePlosStore";

export function InboxDetailView({ id }: { id: string }) {
  const { items, setItemStatus, performItemAction, error } = usePlosStore();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const item = items.find((candidate) => candidate.id === id);

  if (!item) {
    return <EmptyState title="Item not found" copy="This inbox item does not exist in the current mock data set." />;
  }

  const currentItem = item;
  const task = scoreLifeAdminItem(item);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const snoozeDate = tomorrow.toISOString().slice(0, 10);

  async function runAction(action: "snooze" | "save_document" | "create_task") {
    const result = await performItemAction(
      currentItem.id,
      action,
      action === "snooze" ? { snoozedUntil: snoozeDate } : action === "create_task" ? { taskTitle: task.title } : {},
    );

    if (result) {
      const labels = {
        snooze: `Snoozed until ${snoozeDate}.`,
        save_document: "Document saved to records.",
        create_task: "Task created from this item.",
      };
      setActionMessage(labels[action]);
    }
  }

  return (
    <div className="mx-auto max-w-5xl py-4">
      <Link href="/inbox" className="text-sm font-semibold text-stone-600 hover:text-stone-950">
        Back to AI Inbox
      </Link>
      <div className="mt-4 rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={currentItem.category}>{currentItem.category}</Badge>
              <Badge variant={currentItem.priority}>{currentItem.priority}</Badge>
              <Badge variant={currentItem.status}>{currentItem.status}</Badge>
              <Badge variant="score">Score {task.score}</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-black text-stone-950">{currentItem.title}</h1>
            <p className="mt-3 text-stone-600">{currentItem.sender} via {currentItem.source}</p>
          </div>
          <div className="rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700">
            {formatRelativeDueDate(currentItem.dueDate)}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Due date</p>
            <p className="mt-2 font-semibold text-stone-950">{formatDate(currentItem.dueDate)}</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Confidence</p>
            <p className="mt-2 font-semibold text-stone-950">{Math.round(item.confidence * 100)}%</p>
          </div>
          <div className="rounded-lg bg-stone-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Financial impact</p>
            <p className="mt-2 font-semibold text-stone-950">{item.financialImpact ? `$${item.financialImpact.toFixed(2)}` : "Not detected"}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <h2 className="text-lg font-bold text-stone-950">Original Mock Message</h2>
            <p className="mt-3 rounded-lg bg-stone-50 p-4 text-sm leading-7 text-stone-700">{item.originalMessage}</p>
          </section>
          <section>
            <h2 className="text-lg font-bold text-stone-950">Extracted Fields</h2>
            <div className="mt-3 divide-y divide-stone-200 rounded-lg border border-stone-200">
              {item.extractedFields.map((field) => (
                <div key={field.label} className="flex items-center justify-between gap-4 p-3 text-sm">
                  <span className="font-semibold text-stone-600">{field.label}</span>
                  <span className="text-right text-stone-950">{field.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-stone-200 p-4">
            <h2 className="text-lg font-bold text-stone-950">Why PLOS Flagged It</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{item.flaggedReason}</p>
          </div>
          <div className="rounded-lg border border-stone-200 p-4">
            <h2 className="text-lg font-bold text-stone-950">Suggested Next Action</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{item.suggestedAction}</p>
          </div>
        </div>

        <div className="mt-6 rounded-lg bg-stone-50 p-4">
          <h2 className="text-lg font-bold text-stone-950">Actions</h2>
          <div className="mt-4 flex flex-col gap-3">
            <StatusControl value={item.status} onChange={(status) => setItemStatus(item.id, status)} />
            {(actionMessage || error) ? (
              <div className={`rounded-md px-3 py-2 text-sm font-semibold ${error ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800"}`}>
                {error ?? actionMessage}
              </div>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-3">
              <button type="button" onClick={() => void runAction("snooze")} className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-stone-800 ring-1 ring-stone-200">
                Snooze
              </button>
              <button type="button" onClick={() => void runAction("save_document")} className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-stone-800 ring-1 ring-stone-200">
                Save Document
              </button>
              <button type="button" onClick={() => void runAction("create_task")} className="rounded-md bg-white px-4 py-3 text-sm font-semibold text-stone-800 ring-1 ring-stone-200">
                Create Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

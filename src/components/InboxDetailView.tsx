"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { PrivacyPanel } from "@/components/PrivacyPanel";
import { StatusControl } from "@/components/StatusControl";
import { SnoozeModal } from "@/components/SnoozeModal";
import { TaskModal } from "@/components/TaskModal";
import { AutomationSuggestion } from "@/components/AutomationSuggestion";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { formatDate, formatRelativeDueDate } from "@/lib/date";
import { scoreLifeAdminItem } from "@/lib/prioritization";
import { usePlosStore } from "@/lib/usePlosStore";

const sourceProviderMap: Record<string, { provider: string; color: string; icon: React.ReactNode }> = {
  Gmail: {
    provider: "gmail",
    color: "bg-red-500/10 border-red-500/30 text-red-400",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  Calendar: {
    provider: "google-calendar",
    color: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  "Bank alert": {
    provider: "plaid",
    color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  Portal: {
    provider: "health",
    color: "bg-rose-500/10 border-rose-500/30 text-rose-400",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 0C1.46 6.7 1.33 10.28 4 13l8 8 8-8c2.67-2.72 2.54-6.3.42-8.42z" />
      </svg>
    ),
  },
  SMS: {
    provider: "manual",
    color: "bg-violet-500/10 border-violet-500/30 text-violet-400",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  Voicemail: {
    provider: "manual",
    color: "bg-orange-500/10 border-orange-500/30 text-orange-400",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="11.5" r="4.5" />
        <circle cx="18.5" cy="11.5" r="4.5" />
        <line x1="5.5" y1="16" x2="18.5" y2="16" />
      </svg>
    ),
  },
};

export function InboxDetailView({ id }: { id: string }) {
  const { items, isLoading, setItemStatus, performItemAction, error } = usePlosStore();
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const item = items.find((candidate) => candidate.id === id);

  const [isSnoozeOpen, setIsSnoozeOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-400">Loading item...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return <EmptyState title="Item not found" copy="This inbox item does not exist in the current data set." icon="search" />;
  }

  const currentItem = item;
  const task = scoreLifeAdminItem(item);
  const sourceInfo = sourceProviderMap[item.source];

  async function runAction(action: "snooze" | "save_document" | "create_task", payload: Record<string, string> = {}) {
    setActionLoading(true);
    setActionMessage(null);
    const result = await performItemAction(currentItem.id, action, payload);

    if (result) {
      const labels: Record<string, string> = {
        snooze: `Snoozed until ${payload.snoozedUntil ?? "later"}.`,
        save_document: "Document saved to records.",
        create_task: "Task created from this item.",
      };
      setActionMessage(labels[action]);
    }
    setActionLoading(false);
  }

  return (
    <div className="mx-auto max-w-5xl py-4 animate-fade-in">
      <Link href="/inbox" className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-400 hover:text-white transition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15,18 9,12 15,6" />
        </svg>
        Back to AI Inbox
      </Link>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 shadow-sm overflow-hidden">
        {/* Hero header */}
        <div className="border-b border-white/5 bg-gradient-to-r from-white/[0.03] to-transparent p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={currentItem.category}>{currentItem.category}</Badge>
                <Badge variant={currentItem.priority}>{currentItem.priority}</Badge>
                <Badge variant={currentItem.status}>{currentItem.status}</Badge>
                <Badge variant="score">Score {task.score}</Badge>
              </div>
              <h1 className="mt-4 text-3xl font-black text-white">{currentItem.title}</h1>
              <div className="mt-3 flex items-center gap-3">
                {sourceInfo && (
                  <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${sourceInfo.color}`}>
                    {sourceInfo.icon}
                    {item.source}
                  </span>
                )}
                <span className="text-sm text-stone-400">from {currentItem.sender}</span>
              </div>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-3 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Due</p>
              <p className="mt-1 text-sm font-bold text-stone-200">{formatRelativeDueDate(currentItem.dueDate)}</p>
              <p className="text-xs text-stone-400">{formatDate(currentItem.dueDate)}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Key metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Confidence</p>
              <div className="mt-2">
                <ConfidenceIndicator score={item.confidence} />
              </div>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Financial Impact</p>
              <p className="mt-2 text-lg font-bold text-white">{item.financialImpact ? `$${item.financialImpact.toFixed(2)}` : "Not detected"}</p>
            </div>
            <div className="rounded-xl bg-black/20 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Received</p>
              <p className="mt-2 text-sm font-bold text-white">{new Date(item.receivedAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</p>
              <p className="text-xs text-stone-400">{new Date(item.receivedAt).toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })}</p>
            </div>
          </div>

          {/* Content columns */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section>
              <h2 className="text-lg font-bold text-white">Original Message</h2>
              <div className="mt-3 rounded-xl bg-black/20 p-5 text-sm leading-7 text-stone-300 border border-white/5">
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                  {sourceInfo && (
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${sourceInfo.color}`}>
                      {sourceInfo.icon}
                      {item.source}
                    </span>
                  )}
                  <span className="text-xs text-stone-400">
                    {new Date(item.receivedAt).toLocaleString()}
                  </span>
                </div>
                {item.originalMessage}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-white">Source-Specific Extraction</h2>
              <div className="mt-3 divide-y divide-stone-100 rounded-xl border border-white/10 overflow-hidden">
                {item.extractedFields.map((field) => (
                  <div key={field.label} className="flex flex-col gap-1.5 p-3.5 hover:bg-black/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-stone-400">{field.label}</span>
                      <span className="text-right text-sm font-semibold text-white">{field.value}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {sourceInfo && (
                        <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[9px] font-bold ${sourceInfo.color}`}>
                          {sourceInfo.icon}
                          {sourceInfo.provider}
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-[11px] text-stone-400">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <span>{Math.round(item.confidence * 100)}% confidence</span>
                      </div>
                      <span className="text-[11px] text-stone-300">|</span>
                      <span className="text-[11px] text-stone-400">
                        Extracted {new Date(item.receivedAt).toLocaleDateString("en", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Model explainability + suggested action */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-5 bg-black/40">
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-lg font-bold text-white">Model Explainability</h2>
                <Badge variant="score">Score {task.score}</Badge>
              </div>
              <p className="text-sm leading-6 text-stone-400">{item.flaggedReason}</p>
              <div className="mt-4 pt-4 border-t border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">Ranking Factors</h3>
                <ScoreBreakdown task={task} />
              </div>
            </div>
            <div className="rounded-xl border border-white/10 p-5 bg-black/40">
              <h2 className="text-lg font-bold text-white">Suggested Next Action</h2>
              <p className="mt-3 text-sm leading-6 text-stone-400">{item.suggestedAction}</p>
              {item.needsReply && (
                <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
                  <p className="text-xs font-bold text-amber-400">⚡ Reply Required</p>
                  <p className="text-xs text-amber-400/80">This item requires a personal response.</p>
                </div>
              )}
            </div>
          </div>

          {/* Automation suggestion */}
          {item.documentSaveRecommended && (
            <div className="mt-6">
              <AutomationSuggestion itemTitle={item.title} category={item.category} />
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 rounded-xl bg-black/20 border border-white/5 p-5">
            <h2 className="text-lg font-bold text-white">Actions</h2>
            <div className="mt-4 flex flex-col gap-4">
              <StatusControl value={item.status} onChange={(status) => setItemStatus(item.id, status)} />
              {(actionMessage || error) ? (
                <div className={`rounded-lg px-4 py-3 text-sm font-semibold ${error ? "bg-red-950/50 border border-red-500/30 text-red-200" : "bg-emerald-950/30 border border-emerald-500/30 text-emerald-200"}`}>
                  {actionMessage && (
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 animate-check-pop">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      {actionMessage}
                    </div>
                  )}
                  {error && !actionMessage ? error : null}
                </div>
              ) : null}
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setIsSnoozeOpen(true)}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 rounded-lg bg-black/40 px-4 py-3 text-sm font-semibold text-stone-200 ring-1 border border-white/10 transition hover:bg-black/20 disabled:opacity-50"
                  aria-label="Snooze item"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12,6 12,12 16,14" />
                  </svg>
                  Snooze
                </button>
                {item.documentSaveRecommended && (
                  <button
                    type="button"
                    onClick={() => void runAction("save_document")}
                    disabled={actionLoading || !!item.documentSavedAt}
                    className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                      item.documentSavedAt
                        ? "bg-emerald-950/30 text-emerald-400 border border-emerald-500/30"
                        : "bg-black/40 text-stone-200 ring-1 border border-white/10 hover:bg-black/20"
                    }`}
                    aria-label="Save document"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14,2 14,8 20,8" />
                    </svg>
                    {item.documentSavedAt ? "Saved ✓" : "Save Document"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsTaskOpen(true)}
                  disabled={actionLoading || !!item.taskCreatedAt}
                  className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition disabled:opacity-50 ${
                    item.taskCreatedAt
                      ? "bg-emerald-950/30 text-emerald-400 border border-emerald-500/30"
                      : "bg-black/40 text-stone-200 ring-1 border border-white/10 hover:bg-black/20"
                  }`}
                  aria-label="Create task"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                  {item.taskCreatedAt ? "Task Created ✓" : "Create Task"}
                </button>
              </div>
              <div className="mt-2">
                <PrivacyPanel />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSnoozeOpen && (
        <SnoozeModal
          isOpen={isSnoozeOpen}
          onClose={() => setIsSnoozeOpen(false)}
          onConfirm={(date) => {
            void runAction("snooze", { snoozedUntil: date });
            setIsSnoozeOpen(false);
          }}
        />
      )}
      {isTaskOpen && (
        <TaskModal
          isOpen={isTaskOpen}
          onClose={() => setIsTaskOpen(false)}
          defaultTitle={item.title}
          onConfirm={(title, notes) => {
            void runAction("create_task", { taskTitle: title, ...(notes ? { notes } : {}) });
            setIsTaskOpen(false);
          }}
        />
      )}
    </div>
  );
}

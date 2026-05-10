"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/Badge";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { formatRelativeDueDate } from "@/lib/date";
import { fetchJson } from "@/lib/apiClient";
import type { LifeAdminTask, LifeAdminStatus } from "@/lib/types";
import {
  CheckCircle2,
  Eye,
  XCircle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  AlertTriangle,
} from "lucide-react";

function dueDateVariant(dueDate: string | undefined): string {
  if (!dueDate) return "bg-white/5 text-stone-400 ring-1 ring-white/10";
  const days = Math.round(
    (new Date(`${dueDate}T12:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
  );
  if (days < 0) return "bg-red-500/10 text-red-400 ring-1 ring-red-500/30";
  if (days <= 2) return "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/30";
  if (days <= 7) return "bg-blue-500/10 text-blue-400 ring-1 ring-blue-500/30";
  return "bg-white/5 text-stone-400 ring-1 ring-white/10";
}

const statusActions: Array<{
  status: LifeAdminStatus;
  label: string;
  icon: React.ReactNode;
  activeColor: string;
  hoverColor: string;
}> = [
  {
    status: "reviewed",
    label: "Review",
    icon: <Eye size={14} />,
    activeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    hoverColor: "hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20",
  },
  {
    status: "completed",
    label: "Complete",
    icon: <CheckCircle2 size={14} />,
    activeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    hoverColor: "hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20",
  },
  {
    status: "ignored",
    label: "Dismiss",
    icon: <XCircle size={14} />,
    activeColor: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    hoverColor: "hover:bg-zinc-500/10 hover:text-zinc-300 hover:border-zinc-500/20",
  },
  {
    status: "new",
    label: "Reopen",
    icon: <RotateCcw size={14} />,
    activeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    hoverColor: "hover:bg-amber-500/10 hover:text-amber-400 hover:border-amber-500/20",
  },
];

export function TaskActionCard({
  task,
  onStatusChange,
}: {
  task: LifeAdminTask;
  onStatusChange: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isFinished = task.status === "completed" || task.status === "ignored";

  const href = task.messageId ? `/inbox/${task.messageId}` : "/tasks";

  async function handleStatusChange(status: LifeAdminStatus) {
    if (status === task.status) return;
    setProcessing(true);
    try {
      await fetchJson(`/api/life-admin/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      const labels: Record<string, string> = {
        reviewed: "Marked as reviewed",
        completed: "Task completed ✓",
        ignored: "Task dismissed",
        new: "Task reopened",
      };
      setSuccessMsg(labels[status] ?? "Updated");
      setTimeout(() => {
        setSuccessMsg(null);
        onStatusChange();
      }, 1200);
    } catch {
      setSuccessMsg("Update failed");
      setTimeout(() => setSuccessMsg(null), 2000);
    } finally {
      setProcessing(false);
    }
  }

  // Filter out the current status from available actions
  const availableActions = statusActions.filter((a) => a.status !== task.status);

  return (
    <div
      className={`group rounded-2xl border p-5 shadow-lg backdrop-blur-md transition-all duration-300 ${
        isFinished
          ? "bg-white/[0.02] border-white/5 opacity-70"
          : "bg-black/40 border-white/5 hover:border-white/20 hover:bg-black/60 hover:shadow-2xl"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant={task.category}>{task.category}</Badge>
            <Badge variant={task.priority}>{task.priority}</Badge>
            <Badge variant="score">Score {task.score}</Badge>
            <Badge variant={task.status}>{task.status}</Badge>
          </div>

          <Link href={href} className="block group/link">
            <h3
              className={`text-[15px] font-bold leading-snug transition-colors ${
                isFinished
                  ? "text-stone-500 line-through"
                  : "text-white group-hover/link:text-emerald-300"
              }`}
            >
              {task.title}
            </h3>
          </Link>

          <p className="mt-1.5 text-sm leading-relaxed text-stone-400 line-clamp-2">
            {task.suggestedAction}
          </p>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          <div
            className={`rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm ${dueDateVariant(task.dueDate)}`}
          >
            {formatRelativeDueDate(task.dueDate)}
          </div>
          {task.scoreBreakdown && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-300 transition-colors"
            >
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Details
            </button>
          )}
        </div>
      </div>

      {/* Quick-insight pills */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {task.scoreBreakdown?.dueDate !== undefined && task.scoreBreakdown.dueDate > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-400">
            <Clock size={10} />
            Deadline pressure
          </span>
        )}
        {task.scoreBreakdown?.financialImpact !== undefined && task.scoreBreakdown.financialImpact > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            <DollarSign size={10} />
            Financial impact
          </span>
        )}
        {task.scoreBreakdown?.overdue !== undefined && task.scoreBreakdown.overdue > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[11px] font-semibold text-red-400">
            <AlertTriangle size={10} />
            Overdue
          </span>
        )}
      </div>

      {/* Expanded score breakdown */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
          <ScoreBreakdown task={task} />
        </div>
      )}

      {/* Success feedback */}
      {successMsg && (
        <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs font-semibold text-emerald-300 animate-fade-in">
          {successMsg}
        </div>
      )}

      {/* Inline action buttons */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-2">
        {availableActions.map((action) => (
          <button
            key={action.status}
            type="button"
            disabled={processing}
            onClick={() => void handleStatusChange(action.status)}
            className={`inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-1.5 text-xs font-bold text-stone-400 transition-all disabled:opacity-40 ${action.hoverColor}`}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

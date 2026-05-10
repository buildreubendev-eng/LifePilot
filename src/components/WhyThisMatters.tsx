"use client";

import type { LifeAdminMessage, LifeAdminTask } from "@/lib/types";
import { Lightbulb, AlertTriangle, DollarSign, Clock, MessageCircle, Calendar } from "lucide-react";

function getReasons(item?: LifeAdminMessage, task?: LifeAdminTask): Array<{ icon: React.ReactNode; text: string; color: string }> {
  const reasons: Array<{ icon: React.ReactNode; text: string; color: string }> = [];
  const source = task ?? item;
  if (!source) return reasons;

  // Overdue check
  if (source.dueDate) {
    const days = Math.round(
      (new Date(`${source.dueDate}T12:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
    );
    if (days < 0) {
      reasons.push({
        icon: <AlertTriangle size={12} />,
        text: `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} — immediate action required`,
        color: "text-red-400",
      });
    } else if (days <= 2) {
      reasons.push({
        icon: <Clock size={12} />,
        text: `Due in ${days === 0 ? "less than 24 hours" : `${days} day${days === 1 ? "" : "s"}`}`,
        color: "text-amber-400",
      });
    }
  }

  // Financial impact
  if (item?.financialImpact && item.financialImpact > 0) {
    reasons.push({
      icon: <DollarSign size={12} />,
      text: `$${item.financialImpact.toFixed(2)} financial exposure`,
      color: "text-emerald-400",
    });
  }

  // Needs reply
  if (item?.needsReply) {
    reasons.push({
      icon: <MessageCircle size={12} />,
      text: "Requires a personal response",
      color: "text-blue-400",
    });
  }

  // Appointment timing
  if (item?.appointmentStart) {
    const apptDate = new Date(item.appointmentStart);
    const now = new Date();
    const hoursUntil = Math.round((apptDate.getTime() - now.getTime()) / (1000 * 60 * 60));
    if (hoursUntil > 0 && hoursUntil <= 72) {
      reasons.push({
        icon: <Calendar size={12} />,
        text: `Appointment in ${hoursUntil < 24 ? `${hoursUntil} hours` : `${Math.round(hoursUntil / 24)} days`}`,
        color: "text-violet-400",
      });
    }
  }

  // Priority escalation
  if (source.priority === "urgent") {
    reasons.push({
      icon: <AlertTriangle size={12} />,
      text: "Classified as urgent priority",
      color: "text-red-400",
    });
  } else if (source.priority === "high") {
    reasons.push({
      icon: <AlertTriangle size={12} />,
      text: "Classified as high priority",
      color: "text-amber-400",
    });
  }

  return reasons;
}

/**
 * Contextual "why this matters" explanation for high-priority items.
 * Renders nothing if there are no notable factors.
 */
export function WhyThisMatters({
  item,
  task,
}: {
  item?: LifeAdminMessage;
  task?: LifeAdminTask;
}) {
  const reasons = getReasons(item, task);

  if (reasons.length === 0) return null;

  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Lightbulb size={11} className="text-amber-400" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
          Why this matters
        </span>
      </div>
      <div className="grid gap-1.5">
        {reasons.map((reason, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`shrink-0 ${reason.color}`}>{reason.icon}</span>
            <span className="text-[11px] font-semibold text-stone-400">{reason.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

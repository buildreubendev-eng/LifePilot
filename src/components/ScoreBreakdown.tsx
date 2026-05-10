import type { LifeAdminTask } from "@/lib/types";
import { Shield, Clock, DollarSign, AlertTriangle, Sparkles, BarChart3 } from "lucide-react";

const factorConfig: Record<string, { label: string; icon: React.ReactNode; color: string; barColor: string; explanation: (v: number) => string }> = {
  dueDate: {
    label: "Urgency",
    icon: <Clock size={12} />,
    color: "text-blue-400",
    barColor: "bg-blue-500",
    explanation: (v) => v >= 15 ? "Due within 48 hours" : v >= 10 ? "Due this week" : "Low time pressure",
  },
  category: {
    label: "Category Weight",
    icon: <BarChart3 size={12} />,
    color: "text-violet-400",
    barColor: "bg-violet-500",
    explanation: (v) => v >= 10 ? "High-impact category (financial / medical)" : v >= 5 ? "Moderate category priority" : "Standard category",
  },
  financialImpact: {
    label: "Financial",
    icon: <DollarSign size={12} />,
    color: "text-emerald-400",
    barColor: "bg-emerald-500",
    explanation: (v) => v >= 15 ? "Significant financial exposure" : v >= 5 ? "Moderate financial impact" : "Low financial impact",
  },
  confidence: {
    label: "AI Confidence",
    icon: <Shield size={12} />,
    color: "text-amber-400",
    barColor: "bg-amber-500",
    explanation: (v) => v >= 10 ? "High-confidence extraction" : v >= 5 ? "Moderate confidence — review recommended" : "Low confidence — manual verification needed",
  },
  overdue: {
    label: "Overdue",
    icon: <AlertTriangle size={12} />,
    color: "text-red-400",
    barColor: "bg-red-500",
    explanation: (v) => v > 0 ? "Past due date — immediate action required" : "Not overdue",
  },
};

export function ScoreBreakdown({ task, expanded = false }: { task: LifeAdminTask; expanded?: boolean }) {
  const entries = Object.entries(task.scoreBreakdown).filter(([, value]) => value > 0);
  const maxValue = Math.max(...entries.map(([, v]) => v), 1);
  const totalScore = entries.reduce((sum, [, v]) => sum + v, 0);

  if (entries.length === 0) {
    return (
      <div className="text-xs text-stone-500 italic">No scoring factors active</div>
    );
  }

  return (
    <div className="grid gap-2.5">
      {/* Header with total */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          <Sparkles size={10} />
          Score Breakdown
        </div>
        <span className="text-xs font-bold text-white tabular-nums">{totalScore} pts</span>
      </div>

      {/* Factor bars */}
      {entries.map(([key, value]) => {
        const config = factorConfig[key];
        if (!config) return null;
        const percent = Math.min((value / maxValue) * 100, 100);

        return (
          <div key={key} className="group">
            <div className="flex items-center gap-2">
              <div className={`shrink-0 ${config.color}`}>
                {config.icon}
              </div>
              <span className="w-20 text-[11px] font-bold text-stone-400 truncate">{config.label}</span>
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${config.barColor}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-8 text-right text-[11px] font-bold text-stone-300 tabular-nums">+{value}</span>
            </div>
            {expanded && (
              <p className="mt-0.5 ml-[76px] text-[10px] text-stone-500 leading-tight">
                {config.explanation(value)}
              </p>
            )}
          </div>
        );
      })}

      {/* Dominant factor summary */}
      {entries.length > 0 && (
        <div className="mt-1 pt-2 border-t border-white/5">
          <p className="text-[10px] text-stone-500 leading-relaxed">
            <span className="font-bold text-stone-400">Primary driver:</span>{" "}
            {(() => {
              const top = entries.sort((a, b) => b[1] - a[1])[0];
              const config = factorConfig[top[0]];
              return config ? `${config.label} — ${config.explanation(top[1])}` : top[0];
            })()}
          </p>
        </div>
      )}
    </div>
  );
}

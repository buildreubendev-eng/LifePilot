import type { LifeAdminTask } from "@/lib/types";

const factorLabels: Record<string, string> = {
  dueDate: "Urgency",
  category: "Category",
  financialImpact: "Financial",
  confidence: "Confidence",
  overdue: "Overdue",
};

const factorColors: Record<string, string> = {
  dueDate: "bg-blue-500",
  category: "bg-violet-500",
  financialImpact: "bg-emerald-500",
  confidence: "bg-amber-500",
  overdue: "bg-red-500",
};

export function ScoreBreakdown({ task }: { task: LifeAdminTask }) {
  const entries = Object.entries(task.scoreBreakdown).filter(([, value]) => value > 0);
  const maxValue = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <div className="grid gap-1.5">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center gap-2 text-[11px]">
          <span className="w-16 font-semibold text-stone-500">{factorLabels[key] ?? key}</span>
          <div className="flex-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${factorColors[key] ?? "bg-stone-400"}`}
              style={{ width: `${(value / maxValue) * 100}%` }}
            />
          </div>
          <span className="w-6 text-right font-bold text-stone-600 tabular-nums">+{value}</span>
        </div>
      ))}
    </div>
  );
}

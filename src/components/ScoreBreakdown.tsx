import type { LifeAdminTask } from "@/lib/types";

export function ScoreBreakdown({ task }: { task: LifeAdminTask }) {
  return (
    <div className="mt-2 flex w-full flex-col gap-1 rounded-md bg-stone-50 p-3 text-xs text-stone-600 ring-1 ring-stone-200">
      <div className="flex justify-between">
        <span>Due Date Impact:</span>
        <span className="font-semibold text-stone-900">+{task.scoreBreakdown.dueDate}</span>
      </div>
      <div className="flex justify-between">
        <span>Category Importance:</span>
        <span className="font-semibold text-stone-900">+{task.scoreBreakdown.category}</span>
      </div>
      <div className="flex justify-between">
        <span>Financial Impact:</span>
        <span className="font-semibold text-stone-900">+{task.scoreBreakdown.financialImpact}</span>
      </div>
      <div className="flex justify-between">
        <span>AI Confidence:</span>
        <span className="font-semibold text-stone-900">+{task.scoreBreakdown.confidence}</span>
      </div>
      {task.scoreBreakdown.overdue > 0 && (
        <div className="mt-1 border-t border-rose-100 pt-1 flex justify-between text-rose-700">
          <span>Overdue Penalty:</span>
          <span className="font-semibold">+{task.scoreBreakdown.overdue}</span>
        </div>
      )}
    </div>
  );
}

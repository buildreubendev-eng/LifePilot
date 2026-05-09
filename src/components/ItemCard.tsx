import Link from "next/link";
import { Badge } from "@/components/Badge";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { formatRelativeDueDate } from "@/lib/date";
import type { LifeAdminMessage, LifeAdminTask } from "@/lib/types";

function dueDateVariant(dueDate: string | undefined): string {
  if (!dueDate) return "bg-stone-100 text-stone-600";
  const days = Math.round(
    (new Date(`${dueDate}T12:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86_400_000,
  );
  if (days < 0) return "bg-red-100 text-red-800 ring-1 ring-red-200";
  if (days <= 2) return "bg-amber-100 text-amber-800 ring-1 ring-amber-200";
  if (days <= 7) return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
  return "bg-stone-100 text-stone-600";
}

export function ItemCard({
  item,
  task,
  selectable = false,
  selected = false,
  onToggle,
}: {
  item?: LifeAdminMessage;
  task?: LifeAdminTask;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: () => void;
}) {
  const source = task ?? item;

  if (!source) {
    return null;
  }

  const href = item ? `/inbox/${item.id}` : task?.messageId ? `/inbox/${task.messageId}` : "/tasks";

  const innerContent = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-4">
        {selectable && (
          <div className="shrink-0 pt-1">
            <div className={`flex h-5 w-5 items-center justify-center rounded border transition ${selected ? 'border-emerald-600 bg-emerald-500' : 'border-stone-300 bg-white'}`}>
              {selected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
            </div>
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={source.category}>{source.category}</Badge>
            <Badge variant={source.priority}>{source.priority}</Badge>
            {task ? <Badge variant="score">Score {task.score}</Badge> : <Badge variant={source.status}>{source.status}</Badge>}
          </div>
          <h3 className="mt-2.5 text-[15px] font-bold text-stone-950 leading-snug group-hover:text-stone-700 transition-colors">{source.title}</h3>
          <p className="mt-1.5 text-sm leading-6 text-stone-500 line-clamp-2">{source.suggestedAction}</p>
          <div className="mt-2.5 flex items-center gap-3">
            {item?.confidence !== undefined && <ConfidenceIndicator score={item.confidence} />}
            {item?.financialImpact !== undefined && item.financialImpact > 0 && (
              <span className="text-xs font-bold text-stone-500">
                ${item.financialImpact.toFixed(2)}
              </span>
            )}
          </div>
          {task && (
            <div className="mt-2 hidden group-hover:block animate-fade-in">
              <ScoreBreakdown task={task} />
            </div>
          )}
        </div>
      </div>
      <div className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${dueDateVariant(source.dueDate)}`}>
        {formatRelativeDueDate(source.dueDate)}
      </div>
    </div>
  );

  const containerClasses = `group block text-left w-full rounded-xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${selectable && selected ? 'bg-emerald-50 border-emerald-200 shadow-emerald-100' : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-md'}`;

  if (selectable) {
    return (
      <button type="button" onClick={onToggle} className={containerClasses}>
        {innerContent}
      </button>
    );
  }

  return (
    <Link href={href} className={containerClasses}>
      {innerContent}
    </Link>
  );
}

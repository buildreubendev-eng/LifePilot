import Link from "next/link";
import { Badge } from "@/components/Badge";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { formatRelativeDueDate } from "@/lib/date";
import type { LifeAdminMessage, LifeAdminTask } from "@/lib/types";

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
            <div className={`flex h-5 w-5 items-center justify-center rounded border ${selected ? 'border-emerald-600 bg-emerald-500' : 'border-stone-300 bg-white'}`}>
              {selected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
            </div>
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={source.category}>{source.category}</Badge>
            <Badge variant={source.priority}>{source.priority}</Badge>
            {task ? <Badge variant="score">Score {task.score}</Badge> : <Badge variant={source.status}>{source.status}</Badge>}
          </div>
          <h3 className="mt-3 text-base font-semibold text-stone-950 group-hover:text-stone-700">{source.title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">{source.suggestedAction}</p>
          <div className="mt-3 flex items-center gap-3">
            {item?.confidence !== undefined && <ConfidenceIndicator score={item.confidence} />}
            {item?.financialImpact !== undefined && item.financialImpact > 0 && (
              <span className="text-xs font-semibold text-stone-500">
                ${item.financialImpact.toFixed(2)} impact
              </span>
            )}
          </div>
          {task && (
            <div className="mt-2 hidden group-hover:block">
              <ScoreBreakdown task={task} />
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0 rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700">
        {formatRelativeDueDate(source.dueDate)}
      </div>
    </div>
  );

  const containerClasses = `group block text-left w-full rounded-lg border p-4 shadow-sm transition hover:-translate-y-0.5 ${selectable && selected ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-stone-200 hover:border-stone-300 hover:shadow-md'}`;

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

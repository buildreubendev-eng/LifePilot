import Link from "next/link";
import { Badge } from "@/components/Badge";
import { ConfidenceIndicator } from "@/components/ConfidenceIndicator";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import { WhyThisMatters } from "@/components/WhyThisMatters";
import { formatRelativeDueDate } from "@/lib/date";
import type { LifeAdminMessage, LifeAdminTask } from "@/lib/types";

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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex gap-4">
        {selectable && (
          <div className="shrink-0 pt-1">
            <div className={`flex h-5 w-5 items-center justify-center rounded border transition ${selected ? 'border-emerald-500 bg-emerald-500' : 'border-white/20 bg-black/40'}`}>
              {selected && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>}
            </div>
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={source.category}>{source.category}</Badge>
            <Badge variant={source.priority}>{source.priority}</Badge>
            {task ? <Badge variant="score">Score {task.score}</Badge> : <Badge variant={source.status}>{source.status}</Badge>}
          </div>
          <h3 className="mt-3 text-[15px] font-bold text-white leading-snug group-hover:text-emerald-300 transition-colors">{source.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-stone-400 line-clamp-2">{source.suggestedAction}</p>
          <div className="mt-3 flex items-center gap-3">
            {item?.confidence !== undefined && <ConfidenceIndicator score={item.confidence} />}
            {item?.financialImpact !== undefined && item.financialImpact > 0 && (
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                ${item.financialImpact.toFixed(2)}
              </span>
            )}
          </div>
          {task && (
            <div className="mt-3 hidden group-hover:block animate-fade-in border-t border-white/5 pt-3">
              <ScoreBreakdown task={task} />
            </div>
          )}
          <WhyThisMatters item={item} task={task} />
        </div>
      </div>
      <div className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold ${dueDateVariant(source.dueDate)} shadow-sm`}>
        {formatRelativeDueDate(source.dueDate)}
      </div>
    </div>
  );

  const containerClasses = `group block text-left w-full rounded-2xl border p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${selectable && selected ? 'bg-emerald-950/40 border-emerald-500/40 shadow-emerald-900/20' : 'bg-black/40 border-white/5 hover:border-white/20 hover:bg-black/60 hover:shadow-2xl'}`;

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

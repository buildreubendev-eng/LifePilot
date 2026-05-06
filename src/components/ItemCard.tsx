import Link from "next/link";
import { Badge } from "@/components/Badge";
import { formatRelativeDueDate } from "@/lib/date";
import type { LifeAdminMessage, LifeAdminTask } from "@/lib/types";

export function ItemCard({ item, task }: { item?: LifeAdminMessage; task?: LifeAdminTask }) {
  const source = task ?? item;

  if (!source) {
    return null;
  }

  const href = item ? `/inbox/${item.id}` : `/inbox/${task?.messageId}`;

  return (
    <Link
      href={href}
      className="group block rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={source.category}>{source.category}</Badge>
            <Badge variant={source.priority}>{source.priority}</Badge>
            {task ? <Badge variant="score">Score {task.score}</Badge> : <Badge variant={source.status}>{source.status}</Badge>}
          </div>
          <h3 className="mt-3 text-base font-semibold text-stone-950 group-hover:text-stone-700">{source.title}</h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">{source.suggestedAction}</p>
        </div>
        <div className="shrink-0 rounded-md bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700">
          {formatRelativeDueDate(source.dueDate)}
        </div>
      </div>
    </Link>
  );
}

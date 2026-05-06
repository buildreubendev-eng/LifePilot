import type { LifeAdminCategory, LifeAdminStatus, Priority } from "@/lib/types";

type BadgeVariant = LifeAdminCategory | LifeAdminStatus | Priority | "score" | "privacy";

const styles: Record<string, string> = {
  bill: "bg-rose-100 text-rose-800 ring-rose-200",
  renewal: "bg-amber-100 text-amber-900 ring-amber-200",
  appointment: "bg-sky-100 text-sky-800 ring-sky-200",
  travel: "bg-indigo-100 text-indigo-800 ring-indigo-200",
  medical: "bg-red-100 text-red-800 ring-red-200",
  insurance: "bg-violet-100 text-violet-800 ring-violet-200",
  subscription: "bg-orange-100 text-orange-900 ring-orange-200",
  receipt: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  "school/family": "bg-cyan-100 text-cyan-800 ring-cyan-200",
  "tax/document": "bg-slate-200 text-slate-800 ring-slate-300",
  "personal reply": "bg-pink-100 text-pink-800 ring-pink-200",
  new: "bg-blue-100 text-blue-800 ring-blue-200",
  reviewed: "bg-teal-100 text-teal-800 ring-teal-200",
  completed: "bg-green-100 text-green-800 ring-green-200",
  ignored: "bg-zinc-200 text-zinc-700 ring-zinc-300",
  low: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  medium: "bg-yellow-100 text-yellow-800 ring-yellow-200",
  high: "bg-orange-100 text-orange-800 ring-orange-200",
  urgent: "bg-red-100 text-red-800 ring-red-200",
  score: "bg-stone-900 text-white ring-stone-900",
  privacy: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

export function Badge({ children, variant }: { children: React.ReactNode; variant: BadgeVariant }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

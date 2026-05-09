import type { LifeAdminCategory, LifeAdminStatus, Priority } from "@/lib/types";

type BadgeVariant = LifeAdminCategory | LifeAdminStatus | Priority | "score" | "privacy";

const styles: Record<string, string> = {
  bill: "bg-rose-500/10 text-rose-400 ring-rose-500/30",
  renewal: "bg-amber-500/10 text-amber-400 ring-amber-500/30",
  appointment: "bg-sky-500/10 text-sky-400 ring-sky-500/30",
  travel: "bg-indigo-500/10 text-indigo-400 ring-indigo-500/30",
  medical: "bg-red-500/10 text-red-400 ring-red-500/30",
  insurance: "bg-violet-500/10 text-violet-400 ring-violet-500/30",
  subscription: "bg-orange-500/10 text-orange-400 ring-orange-500/30",
  receipt: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
  "school/family": "bg-cyan-500/10 text-cyan-400 ring-cyan-500/30",
  "tax/document": "bg-slate-500/20 text-slate-300 ring-slate-500/30",
  "personal reply": "bg-pink-500/10 text-pink-400 ring-pink-500/30",
  new: "bg-blue-500/10 text-blue-400 ring-blue-500/30",
  reviewed: "bg-teal-500/10 text-teal-400 ring-teal-500/30",
  completed: "bg-green-500/10 text-green-400 ring-green-500/30",
  ignored: "bg-zinc-500/20 text-zinc-400 ring-zinc-500/30",
  low: "bg-zinc-500/20 text-zinc-400 ring-zinc-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/30",
  high: "bg-orange-500/10 text-orange-400 ring-orange-500/30",
  urgent: "bg-red-500/20 text-red-400 ring-red-500/40 font-bold",
  score: "bg-emerald-500/20 text-emerald-300 ring-emerald-500/30 font-bold tracking-wide",
  privacy: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/30",
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

interface MetricCardProps {
  label: string;
  value: string | number;
  detail: string;
  trend?: "up" | "down" | "neutral";
  accent?: "default" | "success" | "warning" | "danger";
}

const accentClasses: Record<string, string> = {
  default: "border-stone-200",
  success: "border-emerald-200",
  warning: "border-amber-200",
  danger: "border-red-200",
};

const trendIcons: Record<string, React.ReactNode> = {
  up: (
    <span className="flex items-center gap-0.5 text-emerald-600">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18,15 12,9 6,15" />
      </svg>
    </span>
  ),
  down: (
    <span className="flex items-center gap-0.5 text-red-500">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6,9 12,15 18,9" />
      </svg>
    </span>
  ),
  neutral: (
    <span className="flex items-center gap-0.5 text-stone-400">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </span>
  ),
};

export function MetricCard({ label, value, detail, trend, accent = "default" }: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${accentClasses[accent]}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
        {trend && trendIcons[trend]}
      </div>
      <p className="mt-3 text-3xl font-black tabular-nums text-stone-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-stone-500">{detail}</p>
    </div>
  );
}

function getConfidenceLabel(score: number): string {
  if (score >= 0.85) return "High";
  if (score >= 0.6) return "Medium";
  return "Low";
}

function getConfidenceColor(score: number): string {
  if (score >= 0.85) return "bg-emerald-500";
  if (score >= 0.6) return "bg-amber-400";
  return "bg-red-400";
}

export function ConfidenceIndicator({ score }: { score: number }) {
  const percent = Math.round(score * 100);
  const label = getConfidenceLabel(score);
  const color = getConfidenceColor(score);

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-12 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-[11px] font-bold text-stone-400">
        {percent}% {label}
      </span>
    </div>
  );
}

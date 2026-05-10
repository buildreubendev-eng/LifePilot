import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion, Info } from "lucide-react";

function getConfidenceConfig(score: number): {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  barColor: string;
  icon: React.ReactNode;
  explanation: string;
} {
  if (score >= 0.9) return {
    label: "Very High",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    barColor: "bg-emerald-500",
    icon: <ShieldCheck size={14} />,
    explanation: "PLOS is highly confident in the extracted data. Automated actions are safe.",
  };
  if (score >= 0.75) return {
    label: "High",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    barColor: "bg-emerald-500",
    icon: <ShieldCheck size={14} />,
    explanation: "Strong extraction accuracy. Low-risk automated actions are recommended.",
  };
  if (score >= 0.6) return {
    label: "Medium",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    barColor: "bg-amber-500",
    icon: <Shield size={14} />,
    explanation: "Moderate confidence. Review extracted fields before taking action.",
  };
  if (score >= 0.4) return {
    label: "Low",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    barColor: "bg-orange-500",
    icon: <ShieldAlert size={14} />,
    explanation: "Low confidence — the source format may be ambiguous. Manual verification required.",
  };
  return {
    label: "Very Low",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
    barColor: "bg-red-500",
    icon: <ShieldQuestion size={14} />,
    explanation: "Extraction reliability is uncertain. Verify all fields manually before proceeding.",
  };
}

export function ConfidenceIndicator({ score, expanded = false }: { score: number; expanded?: boolean }) {
  const percent = Math.round(score * 100);
  const config = getConfidenceConfig(score);

  if (!expanded) {
    // Compact inline version
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 ${config.color}`}>
          {config.icon}
        </div>
        <div className="h-1.5 w-14 rounded-full bg-white/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${config.barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className={`text-[11px] font-bold ${config.color}`}>
          {percent}% {config.label}
        </span>
      </div>
    );
  }

  // Expanded card version with trust reasoning
  return (
    <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black/30 ${config.color}`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-sm font-bold ${config.color}`}>
              {config.label} Confidence
            </span>
            <span className="text-sm font-bold text-white tabular-nums">{percent}%</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-black/30 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${config.barColor}`}
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-start gap-1.5">
            <Info size={10} className="shrink-0 mt-0.5 text-stone-500" />
            <p className="text-[11px] text-stone-400 leading-relaxed">
              {config.explanation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

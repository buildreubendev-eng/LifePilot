import { Badge } from "@/components/Badge";
import { Lock, Shield, CheckSquare, Ban } from "lucide-react";

const privacyPoints = [
  {
    icon: <Lock size={14} />,
    color: "text-emerald-400",
    text: "User data is private, and integrations are permission-based.",
  },
  {
    icon: <Shield size={14} />,
    color: "text-blue-400",
    text: "Sensitive categories like medical, financial, and family items can be disabled.",
  },
  {
    icon: <CheckSquare size={14} />,
    color: "text-amber-400",
    text: "PLOS requires explicit approval before sending messages or changing accounts.",
  },
  {
    icon: <Ban size={14} />,
    color: "text-red-400",
    text: "No payment, cancellation, or subscription action runs automatically in this MVP.",
  },
];

export function PrivacyPanel() {
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-6 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Shield size={18} className="text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="privacy">Privacy first</Badge>
          </div>
          <h2 className="text-sm font-bold text-white mt-0.5">Your data stays under your control</h2>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {privacyPoints.map((point) => (
          <div key={point.text} className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 p-3">
            <span className={`mt-0.5 shrink-0 ${point.color}`}>{point.icon}</span>
            <p className="text-xs leading-relaxed text-stone-400">{point.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

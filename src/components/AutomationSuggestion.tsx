"use client";

import { useState } from "react";
import { Shield, CheckCircle2, X, Zap } from "lucide-react";

export function AutomationSuggestion({ category }: { itemTitle: string; category: string }) {
  const [status, setStatus] = useState<"pending" | "approved" | "declined">("pending");

  if (status === "declined") return null;

  if (status === "approved") {
    return (
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-500/30">
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-300">Automation Enabled</p>
            <p className="mt-0.5 text-xs text-emerald-400/80">
              PLOS will automatically save similar {category} documents directly to your vault.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-500/30">
          <Zap size={16} className="text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-indigo-300">Recommended Automation</h3>
          <p className="text-[10px] uppercase tracking-widest text-indigo-400/60 font-semibold">Trust-gated suggestion</p>
        </div>
      </div>
      <p className="text-sm text-stone-400 leading-relaxed">
        You frequently save {category} documents like this. Would you like PLOS to automatically save future {category} documents from this sender directly to your Document Vault?
      </p>
      <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-indigo-500/10 bg-indigo-950/30 p-2">
        <Shield size={10} className="text-indigo-400 shrink-0" />
        <span className="text-[10px] text-indigo-400/80 leading-tight">
          Automations only apply to low-risk document saves. Payments, messages, and cancellations always require your explicit approval.
        </span>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          onClick={() => setStatus("approved")}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-900/20 transition-all hover:bg-indigo-500 hover:-translate-y-0.5"
        >
          <Zap size={14} />
          Approve Automation
        </button>
        <button
          onClick={() => setStatus("declined")}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-stone-400 transition-all hover:bg-white/10 hover:text-white"
        >
          <X size={14} />
          Not Now
        </button>
      </div>
    </div>
  );
}

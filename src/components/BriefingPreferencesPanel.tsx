"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchJson } from "@/lib/apiClient";
import type { UserSettings } from "@/lib/types";
import { Clock, Bell, Mail, MessageSquare, FileText, Shield } from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export function BriefingPreferencesPanel() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const body = await fetchJson<{ settings: UserSettings }>("/api/life-admin/settings");
        if (active) setSettings(body.settings);
      } catch {
        // Silently fall back — settings may load from parent too
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  async function updateDay(day: UserSettings["weeklyBriefingDay"]) {
    try {
      const body = await fetchJson<{ settings: UserSettings }>("/api/life-admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ weeklyBriefingDay: day }),
      });
      setSettings(body.settings);
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update briefing preferences");
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 p-6 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
          <FileText size={18} className="text-blue-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Weekly Briefing</h2>
          <p className="text-xs text-stone-500">Configure delivery schedule and format</p>
        </div>
        {saved && (
          <span className="ml-auto text-xs font-bold text-emerald-400 animate-fade-in">Saved ✓</span>
        )}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-950/50 border border-red-500/30 px-3 py-2 text-xs font-medium text-red-200">{error}</p>}

      <div className="grid gap-5">
        {/* Briefing Day Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
            <Clock size={10} className="inline mr-1" />
            Delivery Day
          </label>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => void updateDay(day)}
                className={`rounded-lg py-2.5 text-[11px] font-bold text-center transition-all ${
                  settings?.weeklyBriefingDay === day
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                    : "bg-white/[0.03] text-stone-400 border border-white/5 hover:bg-white/5 hover:text-white"
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Delivery Time */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
            Delivery Time
          </label>
          <select
            className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50"
            defaultValue="08:00"
          >
            <option value="06:00">6:00 AM — Early riser</option>
            <option value="07:00">7:00 AM — Morning commute</option>
            <option value="08:00">8:00 AM — Start of day (recommended)</option>
            <option value="09:00">9:00 AM — Late morning</option>
            <option value="17:00">5:00 PM — End of day</option>
            <option value="20:00">8:00 PM — Evening review</option>
          </select>
        </div>

        {/* Delivery Methods */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
            Delivery Channels
          </label>
          <div className="grid gap-2">
            <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04] cursor-pointer">
              <Checkbox defaultChecked />
              <Bell size={14} className="text-blue-400" />
              <div>
                <span className="text-sm font-semibold text-white">Push Notification</span>
                <p className="text-[10px] text-stone-500">Instant alert when briefing is ready</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04] cursor-pointer">
              <Checkbox defaultChecked />
              <Mail size={14} className="text-emerald-400" />
              <div>
                <span className="text-sm font-semibold text-white">Email Summary</span>
                <p className="text-[10px] text-stone-500">Full briefing delivered to your inbox</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04] cursor-pointer">
              <Checkbox />
              <MessageSquare size={14} className="text-violet-400" />
              <div>
                <span className="text-sm font-semibold text-white">SMS (Critical items only)</span>
                <p className="text-[10px] text-stone-500">Only sent when overdue or urgent items exist</p>
              </div>
            </label>
          </div>
        </div>

        {/* Briefing Content */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
            Briefing Format
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" className="rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-left transition-all hover:bg-emerald-950/30">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={12} className="text-emerald-400" />
                <span className="text-xs font-bold text-emerald-300">Executive Summary</span>
              </div>
              <p className="text-[10px] text-stone-500">Key numbers, action items, and quick decisions</p>
            </button>
            <button type="button" className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left transition-all hover:bg-white/[0.04]">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={12} className="text-stone-400" />
                <span className="text-xs font-bold text-stone-400">Detailed Report</span>
              </div>
              <p className="text-[10px] text-stone-500">Full breakdown with category analysis</p>
            </button>
          </div>
        </div>

        {/* Privacy note */}
        <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-start gap-2">
          <Shield size={12} className="shrink-0 mt-0.5 text-stone-500" />
          <p className="text-[10px] text-stone-500 leading-relaxed">
            Briefing content never leaves your account. Email and SMS channels use end-to-end encryption.
          </p>
        </div>
      </div>
    </div>
  );
}

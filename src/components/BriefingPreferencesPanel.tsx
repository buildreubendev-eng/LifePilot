"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchJson } from "@/lib/apiClient";
import type { UserSettings } from "@/lib/types";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export function BriefingPreferencesPanel() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const body = await fetchJson<{ settings: UserSettings }>("/api/life-admin/settings");
        if (active) {
          setSettings(body.settings);
        }
      } catch {
        // Silently fall back — settings may load from parent too
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  async function updateDay(day: UserSettings["weeklyBriefingDay"]) {
    try {
      const body = await fetchJson<{ settings: UserSettings }>("/api/life-admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ weeklyBriefingDay: day }),
      });
      setSettings(body.settings);
      setError(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update briefing preferences");
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/40 p-5 shadow-sm">
      <h2 className="text-lg font-bold text-white">Weekly Briefing Delivery</h2>
      <p className="mt-2 text-sm leading-6 text-stone-400">
        Configure how and when you want to receive your weekly summary.
      </p>

      {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <div className="mt-4 grid gap-4">
        <div>
          <label className="block text-sm font-semibold text-stone-300">Briefing Day</label>
          <select
            value={settings?.weeklyBriefingDay ?? "Friday"}
            onChange={(e) => void updateDay(e.target.value as UserSettings["weeklyBriefingDay"])}
            className="mt-2 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-stone-900"
          >
            {days.map((day) => (
              <option key={day} value={day}>{day}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-stone-300">Delivery Methods</label>
          <div className="mt-2 grid gap-2">
            <label className="flex items-center gap-2">
              <Checkbox defaultChecked />
              <span className="text-sm text-stone-300">Push Notification</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox defaultChecked />
              <span className="text-sm text-stone-300">Email summary</span>
            </label>
            <label className="flex items-center gap-2">
              <Checkbox />
              <span className="text-sm text-stone-300">SMS (Important items only)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

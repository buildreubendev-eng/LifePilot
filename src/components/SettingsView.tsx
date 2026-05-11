"use client";

import { useEffect, useState } from "react";
import { PrivacyPanel } from "@/components/PrivacyPanel";
import { fetchJson } from "@/lib/apiClient";
import type { LifeAdminCategory, UserSettings } from "@/lib/types";
import { ConnectorsPanel } from "@/components/ConnectorsPanel";
import { LearningPreferencesPanel } from "@/components/LearningPreferencesPanel";
import { BriefingPreferencesPanel } from "@/components/BriefingPreferencesPanel";
import { Checkbox } from "@/components/ui/checkbox";
import { usePlosStore } from "@/lib/usePlosStore";
import { GenericSkeleton } from "@/components/Skeleton";

const sensitiveCategories: LifeAdminCategory[] = ["medical", "bill", "school/family", "personal reply"];

export function SettingsView() {
  const { resetStatuses } = usePlosStore();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadInitialSettings() {
      try {
        const body = await fetchJson<{ settings: UserSettings }>("/api/life-admin/settings");
        if (active) {
          setSettings(body.settings);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load settings");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadInitialSettings();
    return () => {
      active = false;
    };
  }, []);

  async function toggleCategory(category: LifeAdminCategory) {
    if (!settings) {
      return;
    }

    const disabledCategories = settings.disabledCategories.includes(category)
      ? settings.disabledCategories.filter((current) => current !== category)
      : [...settings.disabledCategories, category];

    try {
      const body = await fetchJson<{ settings: UserSettings }>("/api/life-admin/settings", {
        method: "PATCH",
        body: JSON.stringify({ disabledCategories }),
      });
      setSettings(body.settings);
      setError(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update settings");
    }
  }

  async function handleReset() {
    setResetMessage(null);
    await resetStatuses();
    setResetMessage("Demo data has been reset to the initial state.");
  }

  if (isLoading) {
    return <GenericSkeleton />;
  }

  return (
    <div>
      <section className="py-4 mb-8">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Preferences & Privacy</h1>
        <p className="mt-3 max-w-3xl text-lg font-light leading-7 text-stone-400">
          Privacy, integration readiness, and local demo controls for the MVP.
        </p>
      </section>
      <PrivacyPanel />
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-black/40 p-6 shadow-lg backdrop-blur-md">
          <h2 className="text-lg font-bold text-white">Approval Rules</h2>
          <div className="mt-4 grid gap-3">
            <SettingRow label="Sending messages" enabled={settings?.approvalRequiredFor.sendingMessages ?? true} />
            <SettingRow label="Making payments" enabled={settings?.approvalRequiredFor.payments ?? true} />
            <SettingRow label="Canceling subscriptions" enabled={settings?.approvalRequiredFor.cancellations ?? true} />
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-500">
            These high-risk actions are intentionally approval-gated in the backend.
          </p>
        </div>
        <ConnectorsPanel />
        <LearningPreferencesPanel />
        <BriefingPreferencesPanel />
        <div className="rounded-2xl border border-white/5 bg-black/40 p-6 shadow-lg backdrop-blur-md">
          <h2 className="text-lg font-bold text-white">Sensitive Categories</h2>
          <div className="mt-4 grid gap-3">
            {sensitiveCategories.map((category) => (
              <label key={category} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3 cursor-pointer hover:bg-white/[0.04] transition-colors">
                <span className="font-semibold capitalize text-stone-200">{category}</span>
                <Checkbox
                  checked={!(settings?.disabledCategories.includes(category) ?? false)}
                  onCheckedChange={() => void toggleCategory(category)}
                />
              </label>
            ))}
          </div>
          {error ? <p className="mt-3 rounded-lg bg-red-950/50 border border-red-500/30 px-3 py-2 text-xs font-medium text-red-200">{error}</p> : null}
          {resetMessage ? <p className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2 text-xs font-medium text-emerald-200">{resetMessage}</p> : null}
          <button type="button" onClick={() => void handleReset()} className="mt-5 rounded-full bg-white/5 border border-white/10 px-5 py-3 text-sm font-semibold text-stone-300 transition-all hover:bg-white/10 hover:text-white">
            Reset Local Demo Data
          </button>
        </div>
      </section>
    </div>
  );
}

function SettingRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <span className="font-semibold text-stone-200">{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        enabled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-stone-500 border border-white/10"
      }`}>
        {enabled ? "Approval required" : "Disabled"}
      </span>
    </div>
  );
}

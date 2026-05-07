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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-stone-200 border-t-stone-900" />
          <p className="mt-4 text-sm font-semibold text-stone-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Preferences & Privacy</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Privacy, integration readiness, and local demo controls for the MVP.
        </p>
      </section>
      <PrivacyPanel />
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-stone-950">Approval Rules</h2>
          <div className="mt-4 grid gap-3">
            <SettingRow label="Sending messages" enabled={settings?.approvalRequiredFor.sendingMessages ?? true} />
            <SettingRow label="Making payments" enabled={settings?.approvalRequiredFor.payments ?? true} />
            <SettingRow label="Canceling subscriptions" enabled={settings?.approvalRequiredFor.cancellations ?? true} />
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            These high-risk actions are intentionally approval-gated in the backend.
          </p>
        </div>
        <ConnectorsPanel />
        <LearningPreferencesPanel />
        <BriefingPreferencesPanel />
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-stone-950">Sensitive Categories</h2>
          <div className="mt-4 grid gap-3">
            {sensitiveCategories.map((category) => (
              <label key={category} className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
                <span className="font-semibold capitalize text-stone-800">{category}</span>
                <Checkbox
                  checked={!(settings?.disabledCategories.includes(category) ?? false)}
                  onCheckedChange={() => void toggleCategory(category)}
                />
              </label>
            ))}
          </div>
          {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
          {resetMessage ? <p className="mt-3 text-sm font-semibold text-emerald-700">{resetMessage}</p> : null}
          <button type="button" onClick={() => void handleReset()} className="mt-5 rounded-md bg-stone-900 px-4 py-3 text-sm font-semibold text-white hover:bg-stone-800">
            Reset Local Demo Data
          </button>
        </div>
      </section>
    </div>
  );
}

function SettingRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
      <span className="font-semibold text-stone-800">{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${enabled ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-700"}`}>
        {enabled ? "Approval required" : "Disabled"}
      </span>
    </div>
  );
}

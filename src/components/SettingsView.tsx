"use client";

import { PrivacyPanel } from "@/components/PrivacyPanel";
import { usePlosStore } from "@/lib/usePlosStore";

const integrations = [
  "Gmail connector",
  "Google Calendar connector",
  "Plaid financial connector",
  "Health portal connector",
];

const sensitiveCategories = ["Medical", "Financial alerts", "School/family", "Personal replies"];

export function SettingsView() {
  const { resetStatuses } = usePlosStore();

  return (
    <div>
      <section className="py-4">
        <h1 className="text-4xl font-black text-stone-950">Settings</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Privacy, integration readiness, and local demo controls for the MVP.
        </p>
      </section>
      <PrivacyPanel />
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-stone-950">Future Integrations</h2>
          <div className="mt-4 grid gap-3">
            {integrations.map((integration) => (
              <label key={integration} className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
                <span className="font-semibold text-stone-800">{integration}</span>
                <input type="checkbox" disabled className="h-5 w-5" />
              </label>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-stone-600">
            Connector interfaces are intentionally mocked. Real Gmail, Google Calendar, Plaid, and health integrations can plug into the data layer later.
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-stone-950">Sensitive Categories</h2>
          <div className="mt-4 grid gap-3">
            {sensitiveCategories.map((category) => (
              <label key={category} className="flex items-center justify-between rounded-lg bg-stone-50 p-3">
                <span className="font-semibold text-stone-800">{category}</span>
                <input type="checkbox" defaultChecked className="h-5 w-5 accent-stone-900" />
              </label>
            ))}
          </div>
          <button type="button" onClick={resetStatuses} className="mt-5 rounded-md bg-stone-900 px-4 py-3 text-sm font-semibold text-white">
            Reset Local Demo Statuses
          </button>
        </div>
      </section>
    </div>
  );
}

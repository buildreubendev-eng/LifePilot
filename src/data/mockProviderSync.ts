import type { IntegrationProvider, RawLifeAdminMessage } from "@/lib/types";

export type MockProviderSyncMessage = Omit<RawLifeAdminMessage, "provider">;

const mockProviderSyncMessages: Record<IntegrationProvider, MockProviderSyncMessage[]> = {
  gmail: [
    {
      id: "sync-gmail-cloudnest-trial",
      externalId: "gmail:cloudnest-trial:2026-05-08",
      source: "Gmail",
      sender: "CloudNest",
      subject: "Your CloudNest trial ends May 8",
      body: "Your premium plan trial ends May 8 and will renew for $19.99/month unless you cancel before then.",
      receivedAt: "2026-05-06T09:20:00-05:00",
    },
    {
      id: "sync-gmail-tax-correction",
      externalId: "gmail:brightpath-tax-correction:2026",
      source: "Gmail",
      sender: "BrightPath Brokerage",
      subject: "Corrected 1099 tax document available May 9",
      body: "Your corrected 1099 tax document is available May 9. Save it for your tax records.",
      receivedAt: "2026-05-06T11:10:00-05:00",
    },
  ],
  "google-calendar": [
    {
      id: "sync-calendar-orthodontist",
      externalId: "gcal:orthodontist:2026-05-12",
      source: "Calendar",
      sender: "Google Calendar",
      subject: "Orthodontist appointment May 12",
      body: "Appointment with Riverbend Orthodontics on May 12 at 3:30 PM. Confirm travel time and school pickup coverage.",
      receivedAt: "2026-05-06T08:00:00-05:00",
    },
  ],
  plaid: [
    {
      id: "sync-plaid-utility-bill",
      externalId: "plaid:utility:metro-energy:2026-05",
      source: "Bank alert",
      sender: "Metro Energy",
      subject: "Utility bill due May 15",
      body: "Your Metro Energy utility bill of $142.18 is due May 15.",
      receivedAt: "2026-05-06T07:45:00-05:00",
    },
  ],
  health: [
    {
      id: "sync-health-prescription",
      externalId: "health:prescription:rx-8421:2026-05",
      source: "Gmail",
      sender: "Northside Pharmacy",
      subject: "Prescription refill due May 10",
      body: "Your prescription refill is due May 10. Confirm pickup or request delivery through the pharmacy portal.",
      receivedAt: "2026-05-06T12:30:00-05:00",
    },
  ],
};

export function getMockProviderSyncMessages(provider: IntegrationProvider): MockProviderSyncMessage[] {
  return mockProviderSyncMessages[provider];
}

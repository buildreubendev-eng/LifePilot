import { mockMessages } from "@/data/mockMessages";
import type { LifeAdminMessage } from "@/lib/types";

export async function getLifeAdminMessages(): Promise<LifeAdminMessage[]> {
  // Future Gmail integration: fetch permitted messages, parse life-admin candidates, and normalize to LifeAdminMessage.
  // Future Google Calendar integration: merge upcoming events and appointment reminders into the same model.
  // Future Plaid integration: surface permissioned bills, transactions, and renewal signals without storing bank credentials.
  // Future health integration: ingest permitted appointment, prescription, and billing notifications from patient portals.
  return mockMessages;
}

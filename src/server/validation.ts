import type { IntegrationProvider, LifeAdminCategory, Priority } from "@/lib/types";

export const lifeAdminCategories: LifeAdminCategory[] = [
  "bill",
  "renewal",
  "appointment",
  "travel",
  "medical",
  "insurance",
  "subscription",
  "receipt",
  "school/family",
  "tax/document",
  "personal reply",
];

export const priorities: Priority[] = ["low", "medium", "high", "urgent"];

export const integrationProviders: IntegrationProvider[] = ["gmail", "google-calendar", "plaid", "health"];

export function isLifeAdminCategory(value: unknown): value is LifeAdminCategory {
  return typeof value === "string" && lifeAdminCategories.includes(value as LifeAdminCategory);
}

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && priorities.includes(value as Priority);
}

export function isIntegrationProvider(value: unknown): value is IntegrationProvider {
  return typeof value === "string" && integrationProviders.includes(value as IntegrationProvider);
}

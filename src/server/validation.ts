import type { ApprovalActionType, ApprovalStatus, IntegrationProvider, LifeAdminCategory, Priority, RawMessageProvider } from "@/lib/types";

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

export const approvalActionTypes: ApprovalActionType[] = ["send_message", "make_payment", "cancel_subscription"];

export const approvalReviewStatuses: Array<Exclude<ApprovalStatus, "pending">> = ["approved", "rejected"];

export const rawMessageProviders: RawMessageProvider[] = ["gmail", "google-calendar", "plaid", "health", "manual"];

export function isLifeAdminCategory(value: unknown): value is LifeAdminCategory {
  return typeof value === "string" && lifeAdminCategories.includes(value as LifeAdminCategory);
}

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && priorities.includes(value as Priority);
}

export function isIntegrationProvider(value: unknown): value is IntegrationProvider {
  return typeof value === "string" && integrationProviders.includes(value as IntegrationProvider);
}

export function isApprovalActionType(value: unknown): value is ApprovalActionType {
  return typeof value === "string" && approvalActionTypes.includes(value as ApprovalActionType);
}

export function isApprovalReviewStatus(value: unknown): value is Exclude<ApprovalStatus, "pending"> {
  return typeof value === "string" && approvalReviewStatuses.includes(value as Exclude<ApprovalStatus, "pending">);
}

export function isRawMessageProvider(value: unknown): value is RawMessageProvider {
  return typeof value === "string" && rawMessageProviders.includes(value as RawMessageProvider);
}

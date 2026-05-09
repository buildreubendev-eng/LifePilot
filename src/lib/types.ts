export type LifeAdminCategory =
  | "bill"
  | "renewal"
  | "appointment"
  | "travel"
  | "medical"
  | "insurance"
  | "subscription"
  | "receipt"
  | "school/family"
  | "tax/document"
  | "personal reply";

export type LifeAdminStatus = "new" | "reviewed" | "completed" | "ignored";

export type Priority = "low" | "medium" | "high" | "urgent";

export type LifeAdminSource =
  | "Gmail"
  | "Calendar"
  | "Bank alert"
  | "Portal"
  | "SMS"
  | "Voicemail";

export type RawMessageProvider = "gmail" | "google-calendar" | "plaid" | "health" | "manual";

export interface ExtractedField {
  label: string;
  value: string;
}

export interface LifeAdminMessage {
  id: string;
  title: string;
  category: LifeAdminCategory;
  source: LifeAdminSource;
  sender: string;
  receivedAt: string;
  dueDate?: string;
  priority: Priority;
  suggestedAction: string;
  confidence: number;
  status: LifeAdminStatus;
  originalMessage: string;
  flaggedReason: string;
  extractedFields: ExtractedField[];
  financialImpact?: number;
  documentSaveRecommended?: boolean;
  documentSavedAt?: string;
  needsReply?: boolean;
  appointmentStart?: string;
  snoozedUntil?: string;
  taskCreatedAt?: string;
  updatedAt?: string;
}

export interface LifeAdminTask {
  id: string;
  messageId?: string;
  title: string;
  category: LifeAdminCategory;
  dueDate?: string;
  priority: Priority;
  status: LifeAdminStatus;
  suggestedAction: string;
  score: number;
  scoreBreakdown: {
    dueDate: number;
    category: number;
    financialImpact: number;
    confidence: number;
    overdue: number;
  };
  source: LifeAdminSource;
}

export interface BriefingSummary {
  attentionThisWeek: LifeAdminTask[];
  overdueItems: LifeAdminTask[];
  upcomingBills: LifeAdminTask[];
  scheduleConflicts: LifeAdminMessage[][];
  renewingSubscriptions: LifeAdminTask[];
  documentsToSave: LifeAdminMessage[];
  recommendedActions: string[];
}

export type StatusMap = Record<string, LifeAdminStatus>;

export type LifeAdminAction =
  | "mark_reviewed"
  | "mark_complete"
  | "ignore"
  | "snooze"
  | "save_document"
  | "create_task";

export type DocumentStatus = "queued" | "saved" | "archived";

export interface DocumentRecord {
  id: string;
  sourceMessageId: string;
  title: string;
  category: LifeAdminCategory;
  source: LifeAdminSource;
  status: DocumentStatus;
  savedAt: string;
  notes?: string;
}

export interface ManualTask {
  id: string;
  sourceMessageId?: string;
  title: string;
  category: LifeAdminCategory;
  dueDate?: string;
  priority: Priority;
  status: LifeAdminStatus;
  suggestedAction: string;
  createdAt: string;
  updatedAt: string;
  snoozedUntil?: string;
}

export type IntegrationProvider = "gmail" | "google-calendar" | "plaid" | "health";

export type IntegrationStatus = "not_connected" | "connected" | "paused" | "error";

export interface IntegrationConnection {
  provider: IntegrationProvider;
  label: string;
  status: IntegrationStatus;
  permissionScopes: string[];
  lastSyncAt?: string | null;
  lastSyncCursor?: string | null;
  connectedAt?: string | null;
  notes: string;
}

export interface UserSettings {
  disabledCategories: LifeAdminCategory[];
  approvalRequiredFor: {
    sendingMessages: boolean;
    payments: boolean;
    cancellations: boolean;
  };
  weeklyBriefingDay: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  timezone: string;
}

export type AuditEventType =
  | "status_updated"
  | "item_snoozed"
  | "document_saved"
  | "task_created"
  | "task_updated"
  | "approval_created"
  | "approval_reviewed"
  | "settings_updated"
  | "integration_updated"
  | "store_reset";

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  entityType: "message" | "task" | "document" | "approval" | "settings" | "integration" | "store";
  entityId: string;
  summary: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export type ApprovalActionType = "send_message" | "make_payment" | "cancel_subscription";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface ApprovalRequest {
  id: string;
  actionType: ApprovalActionType;
  sourceMessageId?: string;
  title: string;
  description: string;
  riskLevel: "low" | "medium" | "high";
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewerNote?: string;
}

export interface RawLifeAdminMessage {
  id: string;
  provider: RawMessageProvider;
  source: LifeAdminSource;
  sender: string;
  subject: string;
  body: string;
  receivedAt: string;
  externalId?: string;
}

export interface IngestionRun {
  id: string;
  provider: RawMessageProvider;
  status: "completed" | "partial" | "failed";
  startedAt: string;
  completedAt: string;
  inputCount: number;
  createdItemIds: string[];
  duplicateCount: number;
  failedCount: number;
  errorMessages: string[];
  cursor?: string;
  notes?: string;
}

export type RecommendationActionType = "create_approval" | "save_document" | "create_task";

export interface ActionRecommendation {
  id: string;
  sourceMessageId: string;
  actionType: RecommendationActionType;
  approvalActionType?: ApprovalActionType;
  title: string;
  description: string;
  reason: string;
  priority: Priority;
  riskLevel: ApprovalRequest["riskLevel"];
  dueDate?: string;
  acceptLabel: string;
}

export interface RecommendationAcceptResult {
  recommendation: ActionRecommendation;
  item?: LifeAdminMessage;
  document?: DocumentRecord;
  task?: ManualTask;
  approval?: ApprovalRequest;
}

export interface DashboardSummary {
  lifeAdminScore: number;
  priorityTasks: LifeAdminTask[];
  counts: {
    active: number;
    overdue: number;
    dueThisWeek: number;
    documentsToSave: number;
    messagesNeedingReply: number;
    subscriptionWarnings: number;
    manualTasks: number;
  };
}


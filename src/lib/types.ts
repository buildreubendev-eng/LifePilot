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
  needsReply?: boolean;
  appointmentStart?: string;
}

export interface LifeAdminTask {
  id: string;
  messageId: string;
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

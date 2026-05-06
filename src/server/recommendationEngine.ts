import { daysUntil } from "@/lib/prioritization";
import type {
  ActionRecommendation,
  ApprovalActionType,
  ApprovalRequest,
  DocumentRecord,
  LifeAdminMessage,
  ManualTask,
  Priority,
} from "@/lib/types";

export function generateActionRecommendations({
  messages,
  documents,
  tasks,
  approvals,
  now = new Date(),
}: {
  messages: LifeAdminMessage[];
  documents: DocumentRecord[];
  tasks: ManualTask[];
  approvals: ApprovalRequest[];
  now?: Date;
}): ActionRecommendation[] {
  const recommendations = messages.flatMap((message) =>
    message.status === "completed" || message.status === "ignored"
      ? []
      : [
          ...approvalRecommendation(message, approvals),
          ...documentRecommendation(message, documents),
          ...taskRecommendation(message, tasks),
        ],
  );

  return recommendations.sort((a, b) => recommendationRank(b, now) - recommendationRank(a, now));
}

function approvalRecommendation(message: LifeAdminMessage, approvals: ApprovalRequest[]): ActionRecommendation[] {
  const actionType = inferApprovalAction(message);

  if (!actionType || hasApproval(message.id, actionType, approvals)) {
    return [];
  }

  return [
    {
      id: recommendationId("create_approval", message.id, actionType),
      sourceMessageId: message.id,
      actionType: "create_approval",
      approvalActionType: actionType,
      title: approvalTitle(actionType, message),
      description: approvalDescription(actionType, message),
      reason: "This action is sensitive and must be approved before PLOS can proceed.",
      priority: message.priority,
      riskLevel: actionType === "send_message" ? "medium" : "high",
      dueDate: message.dueDate,
      acceptLabel: "Create Approval",
    },
  ];
}

function documentRecommendation(message: LifeAdminMessage, documents: DocumentRecord[]): ActionRecommendation[] {
  const alreadySaved = message.documentSavedAt || documents.some((document) => document.sourceMessageId === message.id);

  if (!message.documentSaveRecommended || alreadySaved) {
    return [];
  }

  return [
    {
      id: recommendationId("save_document", message.id),
      sourceMessageId: message.id,
      actionType: "save_document",
      title: `Save ${message.title}`,
      description: "Store this item in the PLOS document queue for records, tax, travel, warranty, or medical follow-up.",
      reason: "The item contains a receipt, confirmation, form, policy, or document-like signal.",
      priority: message.priority === "urgent" ? "high" : message.priority,
      riskLevel: "low",
      dueDate: message.dueDate,
      acceptLabel: "Save Document",
    },
  ];
}

function taskRecommendation(message: LifeAdminMessage, tasks: ManualTask[]): ActionRecommendation[] {
  const alreadyCreated = message.taskCreatedAt || tasks.some((task) => task.sourceMessageId === message.id);

  if (alreadyCreated || !["urgent", "high"].includes(message.priority)) {
    return [];
  }

  return [
    {
      id: recommendationId("create_task", message.id),
      sourceMessageId: message.id,
      actionType: "create_task",
      title: `Create task for ${message.title}`,
      description: message.suggestedAction,
      reason: "High-priority items should be tracked as explicit tasks until completed.",
      priority: message.priority,
      riskLevel: "low",
      dueDate: message.dueDate,
      acceptLabel: "Create Task",
    },
  ];
}

export function recommendationId(actionType: ActionRecommendation["actionType"], messageId: string, approvalActionType?: ApprovalActionType): string {
  return ["rec", actionType, approvalActionType, messageId].filter(Boolean).join("-");
}

function inferApprovalAction(message: LifeAdminMessage): ApprovalActionType | undefined {
  const text = `${message.title} ${message.originalMessage}`.toLowerCase();

  if (message.needsReply || message.category === "personal reply") {
    return "send_message";
  }

  if (message.category === "subscription" && (text.includes("trial") || text.includes("cancel") || text.includes("renew"))) {
    return "cancel_subscription";
  }

  if ((message.category === "bill" || message.category === "medical" || message.category === "insurance") && message.financialImpact) {
    return "make_payment";
  }

  return undefined;
}

function hasApproval(messageId: string, actionType: ApprovalActionType, approvals: ApprovalRequest[]): boolean {
  return approvals.some((approval) => approval.sourceMessageId === messageId && approval.actionType === actionType && approval.status === "pending");
}

function approvalTitle(actionType: ApprovalActionType, message: LifeAdminMessage): string {
  if (actionType === "make_payment") return `Approve payment review for ${message.title}`;
  if (actionType === "cancel_subscription") return `Approve cancellation decision for ${message.title}`;
  return `Approve reply for ${message.title}`;
}

function approvalDescription(actionType: ApprovalActionType, message: LifeAdminMessage): string {
  if (actionType === "make_payment") return `Review amount, due date, and source before any payment related to "${message.title}".`;
  if (actionType === "cancel_subscription") return `Confirm whether to cancel, downgrade, or keep the subscription related to "${message.title}".`;
  return `Review the suggested response before sending anything related to "${message.title}".`;
}

function recommendationRank(recommendation: ActionRecommendation, now: Date): number {
  const priorityWeight: Record<Priority, number> = {
    urgent: 100,
    high: 75,
    medium: 45,
    low: 20,
  };
  const riskWeight = recommendation.riskLevel === "high" ? 16 : recommendation.riskLevel === "medium" ? 9 : 4;
  const distance = daysUntil(recommendation.dueDate, now);
  const dueWeight = distance === undefined ? 0 : distance < 0 ? 40 : Math.max(0, 24 - distance * 3);
  return priorityWeight[recommendation.priority] + riskWeight + dueWeight;
}

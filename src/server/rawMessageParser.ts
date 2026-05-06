import type { LifeAdminCategory, LifeAdminMessage, Priority, RawLifeAdminMessage } from "@/lib/types";

export function parseRawLifeAdminMessage(raw: RawLifeAdminMessage): LifeAdminMessage {
  const text = `${raw.subject} ${raw.body}`.toLowerCase();
  const category = inferCategory(text);
  const dueDate = inferDueDate(raw.body) ?? inferDueDate(raw.subject);
  const financialImpact = inferFinancialImpact(raw.body);
  const priority = inferPriority(text, dueDate, financialImpact);
  const confidence = inferConfidence(text, dueDate, financialImpact);

  return {
    id: `msg-${raw.id}`,
    title: raw.subject,
    category,
    source: raw.source,
    sender: raw.sender,
    receivedAt: raw.receivedAt,
    dueDate,
    priority,
    suggestedAction: inferSuggestedAction(category, raw.subject, dueDate),
    confidence,
    status: "new",
    originalMessage: raw.body,
    flaggedReason: inferFlaggedReason(category, dueDate, financialImpact),
    extractedFields: [
      { label: "Sender", value: raw.sender },
      ...(dueDate ? [{ label: "Due date", value: dueDate }] : []),
      ...(financialImpact ? [{ label: "Amount", value: `$${financialImpact.toFixed(2)}` }] : []),
      { label: "Source", value: raw.source },
    ],
    financialImpact,
    documentSaveRecommended: ["receipt", "tax/document", "travel", "insurance", "medical"].includes(category),
    needsReply: category === "personal reply",
  };
}

function inferCategory(text: string): LifeAdminCategory {
  if (hasAny(text, ["fraud", "payment due", "bill", "statement", "balance"])) return "bill";
  if (hasAny(text, ["insurance", "policy"])) return "insurance";
  if (hasAny(text, ["renew", "renewal", "expires", "warranty"])) return "renewal";
  if (hasAny(text, ["appointment", "visit", "checkup", "dentist", "doctor", "vet"])) return "appointment";
  if (hasAny(text, ["flight", "hotel", "reservation", "check-in", "boarding"])) return "travel";
  if (hasAny(text, ["medical", "prescription", "pharmacy", "lab result", "patient"])) return "medical";
  if (hasAny(text, ["subscription", "trial", "premium plan"])) return "subscription";
  if (hasAny(text, ["receipt", "order", "purchase"])) return "receipt";
  if (hasAny(text, ["school", "permission", "field trip", "family"])) return "school/family";
  if (hasAny(text, ["tax", "1099", "document", "passport", "hoa"])) return "tax/document";
  return "personal reply";
}

function inferPriority(text: string, dueDate: string | undefined, financialImpact: number | undefined): Priority {
  if (hasAny(text, ["fraud", "overdue", "today", "urgent"])) return "urgent";
  if (financialImpact && financialImpact > 500) return "high";
  if (dueDate) return "high";
  if (hasAny(text, ["reply", "confirm", "respond"])) return "medium";
  return "low";
}

function inferConfidence(text: string, dueDate: string | undefined, financialImpact: number | undefined): number {
  let confidence = 0.72;
  if (dueDate) confidence += 0.09;
  if (financialImpact) confidence += 0.08;
  if (hasAny(text, ["due", "renew", "appointment", "reservation", "receipt", "trial"])) confidence += 0.07;
  return Math.min(0.98, Number(confidence.toFixed(2)));
}

function inferSuggestedAction(category: LifeAdminCategory, subject: string, dueDate: string | undefined): string {
  const datePhrase = dueDate ? ` by ${dueDate}` : "";
  const actions: Record<LifeAdminCategory, string> = {
    bill: `Review and pay or dispute "${subject}"${datePhrase}.`,
    renewal: `Decide whether to renew "${subject}"${datePhrase}.`,
    appointment: `Confirm calendar details for "${subject}"${datePhrase}.`,
    travel: `Save travel details and check next steps for "${subject}"${datePhrase}.`,
    medical: `Review the medical item and follow up if needed${datePhrase}.`,
    insurance: `Review coverage and payment details for "${subject}"${datePhrase}.`,
    subscription: `Decide whether to keep, downgrade, or cancel "${subject}"${datePhrase}.`,
    receipt: "Save the receipt for records or returns.",
    "school/family": `Handle the family or school deadline${datePhrase}.`,
    "tax/document": `Save the document and verify whether action is needed${datePhrase}.`,
    "personal reply": `Reply when ready${datePhrase}.`,
  };
  return actions[category];
}

function inferFlaggedReason(category: LifeAdminCategory, dueDate: string | undefined, financialImpact: number | undefined): string {
  const signals = [`Detected ${category} language`];
  if (dueDate) signals.push("found a date or deadline");
  if (financialImpact) signals.push("found a dollar amount");
  return `${signals.join(", ")}.`;
}

function inferDueDate(value: string): string | undefined {
  const currentYear = new Date().getFullYear();
  const match = value.match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:,\s*(\d{4}))?/i);

  if (!match) {
    return undefined;
  }

  const parsed = new Date(`${match[1]} ${match[2]}, ${match[3] ?? currentYear} 12:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

function inferFinancialImpact(value: string): number | undefined {
  const match = value.match(/\$([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?)/);
  return match ? Number(match[1].replaceAll(",", "")) : undefined;
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

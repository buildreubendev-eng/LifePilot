# PLOS UI/UX Roadmap For Gemini

This file is scoped to design only. It should produce UI/UX deliverables that map back to the MVP data contracts in `src/lib/types.ts`, mock data in `src/data/mockMessages.ts`, and scoring/service logic in `src/lib/prioritization.ts`.

PLOS is Reuben's Personal Life Operating System. This MVP focuses on the first useful wedge: personal life admin, including bills, renewals, appointments, subscriptions, travel confirmations, receipts, documents, deadlines, and replies.

## Product Experience Goals

- Make PLOS feel like a trusted personal command center, not an enterprise queue.
- Keep the interface calm, modern, premium, and highly scannable.
- Help users understand why an item matters before asking them to act.
- Make privacy and approval boundaries visible without making the product feel anxious.
- Support quick triage on mobile and deeper review on desktop.

## Design System Tasks

- Define a visual language for PLOS: typography scale, spacing, card density, button hierarchy, badge styles, and icon style.
- Create category badge treatments for bill, renewal, appointment, travel, medical, insurance, subscription, receipt, school/family, tax/document, and personal reply.
- Create status treatments for new, reviewed, completed, and ignored.
- Define priority styling for low, medium, high, and urgent.
- Design responsive navigation for Dashboard, AI Inbox, Tasks, Weekly Briefing, Documents, and Settings.
- Design empty states for no overdue items, no documents to save, filtered inbox with no matches, and all tasks completed.
- Define accessible color contrast and focus states for keyboard users.

## Screen-Level Design Tasks

### Dashboard

- Design first-viewport dashboard with the PLOS brand, Life Admin Score, and today's most urgent actions.
- Design grouped sections for priority actions, upcoming deadlines, bills and renewals, appointments, travel, documents to save, messages needing reply, and subscription warnings.
- Provide compact and expanded card variants for desktop and mobile.
- Show how score changes are explained without overwhelming users.

### AI Inbox

- Design inbox list with filters for categories and statuses.
- Include confidence score, source, due date, suggested action, category, priority, and status in each item.
- Design batch review affordances for later phases while keeping MVP single-item actions.
- Design sorted and filtered states.

### Item Detail

- Design detail view for original message, extracted fields, flagged reason, scoring explanation, suggested action, and status controls.
- Design action buttons: Mark Complete, Ignore, Snooze, Save Document, Create Task.
- Include trust copy for actions that will later require user approval before sending messages, making payments, or canceling subscriptions.

### Tasks

- Design ranked task list with score and score breakdown access.
- Include clear separation between generated tasks and source inbox items.
- Show completed and ignored behavior for later enhancement.

### Weekly Briefing

- Design weekly summary cards for attention this week, overdue items, upcoming bills, schedule conflicts, subscriptions renewing soon, documents to save, and recommended actions.
- Design a printable or shareable briefing direction for later phases.

### Documents

- Design save queue for receipts, tax forms, travel confirmations, insurance documents, school forms, and medical billing records.
- Include document-type labels and source references.

### Settings And Privacy

- Design visible privacy panel explaining private data, permission-based integrations, disabled sensitive categories, and required approval for messages, payments, and cancellations.
- Design toggles for future sensitive categories and integrations.
- Include disabled states for Gmail, Google Calendar, Plaid, and health connectors in the MVP.

## Interaction Tasks

- Define tap/click behavior for cards across list and detail views.
- Define status-control transitions for new, reviewed, completed, and ignored.
- Define snooze interaction for a later persisted version.
- Define save-document interaction for a later document vault.
- Define create-task interaction for a later editable task model.
- Create mobile-first triage flow from Dashboard to Detail to completion.

## Backend Connection Points

- `LifeAdminMessage` fields drive inbox cards and detail views.
- `LifeAdminTask` fields drive dashboard priority actions and task lists.
- `BriefingSummary` fields drive weekly briefing groups.
- `LifeAdminStatus` drives local MVP status controls and future persisted state.
- `scoreBreakdown` can power score explanation UI.
- Future integration adapters should return normalized `LifeAdminMessage` objects.

## Roadmap

### Phase 1: MVP Polish

- Refine dashboard hierarchy, card density, and mobile navigation.
- Add polished empty states.
- Improve score explanation and confidence treatment.
- Validate accessibility and responsive behavior.

### Phase 2: Trust And Review Workflow

- Add richer action confirmation states.
- Design review queue and batch triage.
- Add snooze date picker and task creation modal.
- Add sensitive-category controls with clearer privacy affordances.

### Phase 3: Integration-Ready UX

- Design permission flows for Gmail, Google Calendar, Plaid, and health portals.
- Add connector health/status surfaces.
- Design source-specific audit trail for extracted fields.
- Add document vault concepts and search.

### Phase 4: Personalized Intelligence

- Design user preference learning controls.
- Add recommended automations that require approval.
- Add weekly briefing delivery preferences.
- Add explainability for model confidence and ranking changes.

# Gemini Start Here: PLOS UI/UX Design Brief

You are responsible for UI/UX design only for PLOS. Do not build backend systems or real integrations. Design work should connect cleanly to the existing Next.js MVP in this repository.

## Product

PLOS is Reuben's Personal Life Operating System. This MVP starts with personal life admin: helping users manage emails, calendar events, bills, renewals, appointments, subscriptions, travel confirmations, receipts, deadlines, documents, and reminders from one calm action dashboard.

The original working prompt called the product "LifePilot." Treat that as the old codename. The user-facing product and Reuben website alignment should be PLOS.

## Design Goal

Make PLOS feel modern, calm, premium, and trustworthy. It should feel like a personal command center, not a cluttered enterprise SaaS tool.

## Existing App Structure

Use these implementation files as the backend/data contract reference:

- `../src/lib/types.ts`: data models and field names.
- `../src/data/mockMessages.ts`: 20 realistic mock messages.
- `../src/lib/prioritization.ts`: scoring, tasks, Life Admin Score, and weekly briefing logic.
- `../src/app`: current Next.js routes.
- `../src/components`: current reusable UI components.

## Required Screens

Design complete responsive UX for:

- Dashboard
- AI Inbox
- Inbox item detail
- Tasks
- Weekly Briefing
- Documents
- Settings and privacy controls

## Screen Requirements

### Dashboard

- Show "PLOS" clearly.
- Show today's priority actions.
- Show upcoming deadlines.
- Show bills and renewals.
- Show appointments.
- Show travel items.
- Show documents to save.
- Show messages needing reply.
- Show subscription warnings.
- Show a Life Admin Score from 0 to 100.

### AI Inbox

Each parsed item should show:

- Title
- Category
- Source
- Due date
- Priority
- Suggested action
- Confidence score
- Status: new, reviewed, completed, ignored

Categories:

- bill
- renewal
- appointment
- travel
- medical
- insurance
- subscription
- receipt
- school/family
- tax/document
- personal reply

### Item Detail

Show:

- Original mock message
- Extracted fields
- Why PLOS flagged it
- Suggested next action
- Buttons for Mark Complete, Ignore, Snooze, Save Document, Create Task

### Weekly Briefing

Summarize:

- What needs attention this week
- Overdue items
- Upcoming bills
- Schedule conflicts
- Subscriptions renewing soon
- Documents that should be saved
- Recommended actions

### Settings And Privacy

Include visible privacy-first design explaining:

- User data is private.
- Integrations are permission-based.
- Sensitive categories can be disabled.
- User approval is required before sending messages, making payments, or canceling subscriptions.

## UX Roadmap

### Phase 1: MVP Polish

- Refine dashboard hierarchy, density, and mobile navigation.
- Improve empty states.
- Make confidence and priority easier to understand.
- Ensure responsive layouts work on mobile and desktop.

### Phase 2: Trust And Review Workflow

- Design confirmation states for user actions.
- Add batch triage concepts.
- Add snooze date picker.
- Add create-task modal.
- Make sensitive-category controls more explicit.

### Phase 3: Integration-Ready UX

- Design permission flows for Gmail, Google Calendar, Plaid, and health portals.
- Add connector health/status surfaces.
- Design audit trail for extracted fields.
- Add document vault and search concepts.

### Phase 4: Personalized Intelligence

- Design user preference learning controls.
- Add recommended automations that require approval.
- Add weekly briefing delivery preferences.
- Add explainability for ranking and confidence changes.

## Deliverables

Produce design guidance that can be handed back to implementation:

- Screen-by-screen UX spec.
- Component inventory.
- Responsive behavior notes.
- Empty states.
- Interaction states.
- Accessibility notes.
- Any copy changes needed.
- Any new frontend components or props the implementation should add.

Keep all recommendations tied to the existing data models and routes. If a design needs a new field or backend behavior, call it out explicitly.

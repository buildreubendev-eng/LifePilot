# PLOS MVP

PLOS is Reuben's Personal Life Operating System. This app is the first practical MVP slice of that vision: an AI-powered personal life admin dashboard that turns bills, renewals, appointments, travel confirmations, receipts, documents, deadlines, and personal replies into a prioritized action dashboard.

The original working prompt called the app "LifePilot." Treat that as the old codename. The user-facing product is now PLOS.

## What Is Included

- Dashboard with Life Admin Score and prioritized action sections.
- AI Inbox with 20 realistic parsed life-admin messages.
- Item detail view with original message, extracted fields, flagged reason, suggested next action, status controls, and MVP action buttons.
- Task generation and prioritization service using due date proximity, financial impact, category importance, confidence, and overdue status.
- Weekly Briefing generated from the same mock data.
- Documents and Settings pages with no placeholder-only routes.
- Local status changes persisted in browser localStorage.
- Privacy-first settings panel and integration comments for future Gmail, Google Calendar, Plaid, and health connectors.
- Basic Vitest coverage for prioritization behavior.

## Architecture

- `src/lib/types.ts`: shared TypeScript data contracts.
- `src/data/mockMessages.ts`: realistic local mock life-admin data.
- `src/data/integrationAdapters.ts`: future integration boundary for Gmail, Calendar, Plaid, and health data.
- `src/lib/prioritization.ts`: task generation, scoring, Life Admin Score, schedule conflicts, and weekly briefing logic.
- `src/lib/usePlosStore.ts`: local browser state for item statuses.
- `src/components`: reusable cards, badges, filters, status controls, privacy panel, and page views.
- `src/app`: Next.js App Router pages.
- `gemini/START_HERE_UI_UX.md`: design-only starting brief for Gemini.
- `UI_UX_ROADMAP.md`: broader design-only task list and roadmap.

## Run The App

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm run typecheck
npm run lint
npm run test
```

The app intentionally does not implement real bank, email, calendar, or health integrations yet. The mock integration boundary keeps the MVP ready for those connectors later.

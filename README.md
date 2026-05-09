# PLOS MVP

PLOS is Reuben's Personal Life Operating System. This app is the first practical MVP slice of that vision: an AI-powered personal life admin dashboard that turns bills, renewals, appointments, travel confirmations, receipts, documents, deadlines, and personal replies into a prioritized action dashboard.

The original working prompt called the app "LifePilot." Treat that as the old codename. The user-facing product is now PLOS.

## What Is Included

- Dashboard with Life Admin Score and prioritized action sections.
- AI Inbox with 20 realistic parsed life-admin messages.
- Item detail view with original message, extracted fields, flagged reason, suggested next action, status controls, and MVP action buttons.
- Task generation and prioritization service using due date proximity, financial impact, category importance, confidence, and overdue status.
- Recommendation engine that turns active items into safe next moves, approval requests, saved documents, and tasks.
- Weekly Briefing generated from the same mock data.
- Documents, Approvals, Integrations, Ingest, Activity, and Settings pages with no placeholder-only routes.
- Local status changes persisted in browser localStorage.
- Privacy-first settings panel and integration comments for future Gmail, Google Calendar, Plaid, and health connectors.
- Basic Vitest coverage for prioritization behavior.

## Architecture

- `src/lib/types.ts`: shared TypeScript data contracts.
- `src/data/mockMessages.ts`: realistic local mock life-admin data.
- `src/data/integrationAdapters.ts`: future integration boundary for Gmail, Calendar, Plaid, and health data.
- `src/lib/prioritization.ts`: task generation, scoring, Life Admin Score, schedule conflicts, and weekly briefing logic.
- `src/lib/usePlosStore.ts`: local browser state for item statuses.
- `src/server/lifeAdminRepository.ts`: repository boundary for current mock data and future persistence.
- `src/server/lifeAdminService.ts`: backend service for items, status updates, generated tasks, dashboard summary, and weekly briefing.
- `prisma/schema.prisma`: SQLite database schema for durable persistence.
- `prisma/migrations/00000000000000_init/migration.sql`: initial SQLite migration for deployable Prisma mode.
- `src/components`: reusable cards, badges, filters, status controls, privacy panel, and page views.
- `src/app`: Next.js App Router pages.
- `src/lib/apiClient.ts`: small browser fetch helper for typed backend calls.
- `gemini/START_HERE_UI_UX.md`: design-only starting brief for Gemini.
- `UI_UX_ROADMAP.md`: broader design-only task list and roadmap.

## Backend API

- `GET /api/life-admin/items`: list parsed life-admin items.
- `GET /api/life-admin/items/:id`: fetch one parsed item.
- `PATCH /api/life-admin/items/:id`: update item status with `new`, `reviewed`, `completed`, or `ignored`.
- `POST /api/life-admin/items/:id/action`: perform `mark_reviewed`, `mark_complete`, `ignore`, `snooze`, `save_document`, or `create_task`.
- `GET /api/life-admin/tasks`: list generated and prioritized tasks.
- `POST /api/life-admin/tasks`: create a manual task.
- `PATCH /api/life-admin/tasks/:id`: update a manual task.
- `GET /api/life-admin/recommendations`: list generated next-step recommendations.
- `POST /api/life-admin/recommendations/:id/accept`: accept a recommendation and create its durable backend artifact.
- `GET /api/life-admin/dashboard`: return Life Admin Score, priority tasks, and dashboard counts.
- `GET /api/life-admin/health`: return backend health checks, repository mode, seed counts, settings readiness, and connector registry readiness.
- `GET /api/life-admin/briefing`: return weekly briefing summary.
- `GET /api/life-admin/documents`: list saved document records.
- `GET /api/life-admin/settings`: read privacy and briefing settings.
- `PATCH /api/life-admin/settings`: update disabled categories, approval requirements, briefing day, or timezone.
- `GET /api/life-admin/integrations`: list future connector states.
- `PATCH /api/life-admin/integrations/:provider`: update future connector state for Gmail, Calendar, Plaid, or health.
- `GET /api/life-admin/audit`: list backend audit events.
- `GET /api/life-admin/approvals`: list approval requests for sensitive actions.
- `POST /api/life-admin/approvals`: create an approval request for `send_message`, `make_payment`, or `cancel_subscription`.
- `PATCH /api/life-admin/approvals/:id`: approve or reject a pending approval request.
- `POST /api/life-admin/ingest`: ingest raw provider messages into normalized life-admin items.
- `GET /api/life-admin/ingest/runs`: list ingestion run history.
- `POST /api/life-admin/reset`: reset the local MVP data store back to the mock seed state.

By default, local MVP persistence is stored in `.data/plos-store.json`, which is ignored by Git. This keeps the backend stateful without introducing a database dependency during UI work.

For durable backend mode, set `PLOS_REPOSITORY=prisma` and provide `DATABASE_URL`. The same service/API layer will use Prisma instead of the JSON store.

## Prisma SQLite Setup

Prisma is installed and the SQLite schema plus initial migration are defined under `prisma/`. The app can run with either the JSON repository or the Prisma repository.

```bash
copy .env.example .env
npm run db:generate
npm run db:deploy
```

For Prisma-backed runtime:

```env
DATABASE_URL="file:./dev.db"
PLOS_REPOSITORY="prisma"
```

The schema includes tables for life-admin messages, manual tasks, documents, settings, integrations, audit events, approvals, raw ingested messages, and ingestion runs. The Prisma repository seeds the mock inbox, settings, and integration registry on first use.

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
npm run build
```

The app intentionally does not implement real bank, email, calendar, or health integrations yet. The mock integration boundary keeps the MVP ready for those connectors later.

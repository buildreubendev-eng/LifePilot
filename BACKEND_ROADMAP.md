# PLOS Backend Roadmap

This roadmap is for API behavior, persistence, integration boundaries, data safety, and deploy readiness. Keep UI-only work in `FRONTEND_ROADMAP.md`.

## Current State

- Next.js App Router API routes exist for items, tasks, dashboard, briefing, documents, settings, integrations, audit, approvals, ingestion, recommendations, reset, and health.
- JSON demo mode works on Vercel using writable temp storage.
- Prisma repository mode exists with SQLite schema, migration SQL, seed behavior, health checks, and integration tests.
- Real Gmail, Calendar, Plaid, and health integrations are intentionally not connected yet.

## Phase 1: Backend Safety And Idempotency

- Done: document saves are idempotent.
- Done: create-task item actions are idempotent so duplicate clicks do not create duplicate manual tasks.
- Done: pending approval creation is idempotent for repeated sensitive-action requests.
- Done: recommendation acceptance returns existing durable artifacts when they already exist.
- Done: tests cover duplicate item actions, duplicate recommendation acceptance, and audit behavior.
- Done: repository-level uniqueness constraints protect source-backed tasks, documents, pending approvals, and provider external IDs.

## Phase 2: Durable Production Persistence

- Choose hosted Postgres provider: Neon, Supabase, Vercel Postgres, or Railway Postgres.
- Convert Prisma datasource from SQLite to Postgres.
- Add migration path from current schema to Postgres-compatible schema.
- Add environment guidance for production:
  - `PLOS_REPOSITORY=prisma`
  - `DATABASE_URL=<postgres-url>`
- Verify health route, dashboard, actions, ingestion, approvals, and reset against Postgres.

## Phase 3: User And Session Boundary

- Add a `User` or `Workspace` model before real integrations.
- Scope messages, tasks, documents, settings, integrations, approvals, raw messages, ingestion runs, and audit events by user/workspace.
- Keep demo mode seeded for a single demo workspace.
- Add tests proving cross-user data cannot leak once auth arrives.

## Phase 4: Integration Simulation Layer

- Done: raw-message ingestion is idempotent by provider external ID, with raw ID fallback for MVP payloads.
- Done: fake connector sync endpoint uses current mock providers but behaves like a real permissioned sync.
- Done: sync and ingestion runs track provider cursors, duplicate counts, failed counts, and partial failures.
- Add API contracts for future OAuth connectors without connecting real accounts yet.

## Phase 5: Real Connector Readiness

- Add Gmail read-only ingestion adapter behind explicit permission state.
- Add Google Calendar read-only appointment/conflict adapter.
- Add Plaid recurring-charge signal adapter only after legal/privacy review.
- Add health portal notification adapter only after stricter privacy controls.
- Keep all sending, payment, cancellation, and health actions approval-gated.

## Quality Gates

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- API smoke checks:
  - `GET /api/life-admin/health`
  - `GET /api/life-admin/dashboard`
  - `POST /api/life-admin/items/:id/action`
  - `POST /api/life-admin/recommendations/:id/accept`

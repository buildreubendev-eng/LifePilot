# PLOS Frontend Roadmap

This roadmap is for UI behavior, workflow polish, responsive quality, and demo usability. Keep backend contract changes in `BACKEND_ROADMAP.md`.

## Current State

- Dashboard, AI Inbox, Tasks, Suggestions, Weekly Briefing, Documents, Approvals, Integrations, Ingest, Activity, and Settings screens exist.
- The deployed app runs through Reuben and uses mock life-admin data.
- Recent QOL work added inbox search, status/category filters, batch triage, dashboard refresh/reset controls, and backend health status.

## Phase 1: Demo-Ready Workflow Polish ✅

- ✅ Polish item detail actions: clearer action grouping, better confirmations, disabled duplicate states, and a tighter extracted-fields layout.
- ✅ Improve Tasks so users can complete, review, ignore, or reopen tasks from the Tasks screen (TaskActionCard).
- ✅ Improve Recommendations so accepted recommendations show a completed state (inline accepted badge + strikethrough).
- ✅ Add stronger empty states that explain what changed after filters, reset, or completed work.
- ✅ Keep the Reset Demo Data action visible but not visually dominant.
- ✅ Fix all light-mode styling leaks across InboxDetailView source badges, hero header, and action feedback.

## Phase 2: Mobile Quality Pass

- Audit Dashboard, AI Inbox filters, item detail, Tasks, Recommendations, and bottom navigation at phone widths.
- Ensure filter chips wrap cleanly without horizontal scrollbars.
- Keep floating batch controls inside the viewport.
- Make long category names, sender names, and action text wrap without breaking cards.
- Verify tap targets are large enough for quick mobile triage.

## Phase 3: Trust And Explainability

- Make score and confidence explanations easier to scan.
- Add "why this matters" summaries to high-priority items.
- Make approval-first behavior visible near sensitive recommendations.
- Improve source-specific extraction display for Gmail, Calendar, Plaid, health, SMS, and voicemail mock inputs.
- Surface audit history in a way that feels useful rather than technical.

## Phase 4: Integration-Ready UX

- Design connector setup flows for Gmail, Google Calendar, Plaid, and health portals.
- Add connector sync health states: not connected, connected, paused, error, last sync, and next sync.
- Add ingestion previews before creating normalized life-admin items.
- Add document vault search and category filtering.
- Add weekly briefing delivery preference controls.

## Quality Gates

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual browser review on desktop and mobile widths for any changed screen.


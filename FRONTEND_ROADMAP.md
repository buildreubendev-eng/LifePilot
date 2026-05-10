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

## Phase 2: Mobile Quality Pass ✅

- ✅ Audit Dashboard, AI Inbox filters, item detail, Tasks, Recommendations, and bottom navigation at phone widths.
- ✅ Ensure filter chips wrap cleanly without horizontal scrollbars (overflow-x: hidden, flex-wrap on CategoryFilter).
- ✅ Keep floating batch controls inside the viewport (bottom-20 on mobile, above bottom nav).
- ✅ Make long category names, sender names, and action text wrap without breaking cards.
- ✅ Verify tap targets are large enough for quick mobile triage (min-h-[44px] on bottom nav, min-h-[36px] on filter chips).
- ✅ Add safe-area-inset-bottom support for notched devices.
- ✅ Fix body background from light (#fafaf9) to dark (#0a0a0a).
- ✅ Add viewport-fit=cover meta tag.

## Phase 3: Trust And Explainability ✅

- ✅ Make score and confidence explanations easier to scan (ScoreBreakdown redesign with visual bars, factor icons, contextual explanations, and dominant-factor summary).
- ✅ Add "why this matters" summaries to high-priority items (new WhyThisMatters component on ItemCard and InboxDetailView — surfaces overdue, financial, reply-required, appointment, and priority reasons).
- ✅ Make approval-first behavior visible near sensitive recommendations (ApprovalsView overhaul with trust framework banner, risk-level shield icons, action type icons, high-risk warning callouts).
- ✅ Redesign ConfidenceIndicator with 5-tier trust levels, shield icons, and expanded mode with trust reasoning explanations.
- ✅ Overhaul AutomationSuggestion to dark executive theme with trust framework callout explaining approval-first model.
- ✅ Use expanded ConfidenceIndicator and expanded ScoreBreakdown in InboxDetailView for maximum transparency.
- ✅ Improve source-specific extraction display with provider badges and confidence annotations.

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


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

## Phase 4: Integration-Ready UX ✅

- ✅ Design connector setup flows for Gmail, Google Calendar, Plaid, and health portals (IntegrationsView overhaul with provider-specific icons, gradient backgrounds, setup wizard guide for disconnected providers, Connect/Disconnect CTAs).
- ✅ Add connector sync health states: not connected, connected, paused, error, last sync, and next sync (3-column sync metrics strip per connector, estimated next sync calculation, health badges with shield icons).
- ✅ Add ingestion previews before creating normalized life-admin items (IngestView redesign with extraction preview panel showing expected input/output, provider pill selector with icons, improved run history).
- ✅ Add document vault search and category filtering (DocumentsView dark theme fix — replaced all light-mode category badges with dark-mode variants, improved search input styling, consistent error/status badges).
- ✅ Add weekly briefing delivery preference controls (BriefingPreferencesPanel redesign with day-of-week pill selector, delivery time picker, detailed channel options with icons and descriptions, briefing format selector).
- ✅ Fix SettingsView dark theme consistency (approval rules badges, error messages, category toggles, reset button — all converted to dark executive theme).
- ✅ Fix all remaining light-mode badge artifacts across DocumentsView, ApprovalsView, and SettingsView.

## Phase 5: Final Polish & Consistency ✅

- ✅ Overhaul ActivityView into a proper Audit Trail — timeline UI with vertical line and dots, event-type icons and color-coded badges, expandable detail panel per event showing metadata, relative timestamps ("5m ago"), filter pills with icons.
- ✅ Overhaul WeeklyBriefingView into Executive Briefing — quick stats strip (Attention/Overdue/Financial/Conflicts/Documents), recommended actions banner with TrendingUp icons, section-level icons, date badge, consistent dark theme.
- ✅ Add icon prop to Section component for visual category indicators on section headers.
- ✅ Fix LearningPreferencesPanel — dark theme with lucide icons (Brain/Sparkles/FileText), interactive card layout with hover states.
- ✅ Fix PrivacyPanel — replaced light-mode emerald-50 background with dark emerald-950/10, replaced inline SVGs with lucide icons (Lock/Shield/CheckSquare/Ban), fixed invalid `bg-black/40/60` class.

## Phase 6: Power User UX & Perceived Performance ✅

### Keyboard Shortcuts
- ✅ Created `useKeyboardShortcuts` hook with G-prefix navigation (G→D=Dashboard, G→I=Inbox, G→T=Tasks, G→S=Suggestions, G→B=Briefing, G→O=Documents, G→A=Approvals, G→N=Integrations, G→E=Settings).
- ✅ Created `KeyboardShortcutOverlay` component — full-screen overlay triggered by `?` key showing all shortcuts grouped by category.
- ✅ Integrated into AppFrame with sidebar "Shortcuts" button, floating pending-prefix indicator, and overlay rendering.
- ✅ Added `/` to focus search inputs, `Escape` to close overlays, auto-clear pending prefix after 1.5s timeout.
- ✅ All shortcuts disabled when focus is in inputs/textareas/selects.

### Skeleton Loaders
- ✅ Created `Skeleton.tsx` with shimmer animation components: SkeletonPulse, SkeletonMetricCard, SkeletonMetrics, SkeletonItemCard, SkeletonItemGrid, SkeletonSectionHeader, SkeletonPageHeader.
- ✅ Created view-specific skeletons: DashboardSkeleton (hero + ring + metrics + items), InboxSkeleton (search + filters + items), TasksSkeleton (metrics + filters + items), IntegrationsSkeleton (metrics + connector cards with sync strips).
- ✅ Replaced spinner loading states across ALL 10 views: DashboardView, InboxView, TasksView, IntegrationsView, IngestView, DocumentsView, ActivityView, WeeklyBriefingView, RecommendationsView, SettingsView.

## Phase 7: Command Palette & Toast Notifications ✅

### Command Palette (⌘K)
- ✅ Created `CommandPalette.tsx` — full command palette with fuzzy search across navigation pages and inbox items.
- ✅ Keyboard navigable (↑↓ Arrow Keys + Enter to select, Escape to close).
- ✅ Grouped results: "Pages" (11 navigation targets) and "Inbox Items" (up to 30 searchable items with sender/category).
- ✅ Auto-focuses search input on open, scrolls selected result into view.
- ✅ Added ⌘K / Ctrl+K shortcut to `useKeyboardShortcuts` hook — works even when focused in inputs.
- ✅ Added "Search..." button with ⌘K hint in sidebar footer.
- ✅ Footer shows keyboard navigation hints (↑↓ navigate, ⏎ open, esc close).

### Toast Notification System
- ✅ Created `ToastProvider.tsx` — context-based toast system with `useToast()` hook.
- ✅ 4 variants: success (emerald), error (red), warning (amber), info (blue) — each with icon, border, and background.
- ✅ Auto-dismiss: 4s for success/info/warning, 6s for errors. Manual dismiss via X button.
- ✅ Max 5 toasts visible, stacked in bottom-right corner with slide-up animation and backdrop blur.
- ✅ `aria-live="polite"` + `role="alert"` for accessibility.
- ✅ Migrated DashboardView and InboxView from inline notice banners to toast notifications.
- ✅ Wrapped main content area with `ToastProvider` in AppFrame.

## Phase 8: Accessibility Audit ✅

### ARIA Labels & Landmarks
- ✅ `CategoryFilter` — added `role="group"` and `aria-label="Filter by category"`.
- ✅ `ItemCard` — added `aria-label` to selectable buttons (dynamic Select/Deselect), `aria-pressed` state, and `aria-label` on card links.
- ✅ `TaskActionCard` — added `role="article"`, `aria-label` on all action buttons, `aria-expanded` and `aria-label` on expand toggle.
- ✅ `Section` — added `aria-labelledby` linking to heading, `aria-expanded` + `aria-controls` on collapsible toggle, `aria-hidden` on decorative icons, `useId()` for unique heading IDs.
- ✅ `InboxView` — added `role="group"` and `aria-label="Filter by status"` to status filter group.
- ✅ `AppFrame` sidebar — added `aria-current="page"` to active nav links, `aria-hidden="true"` on decorative icon spans.
- ✅ `AppFrame` mobile header — added `aria-label="Mobile navigation"`, contextual `aria-label` on menu toggle (Open/Close), `aria-expanded` state, `aria-label="PLOS Dashboard home"` on logo link.
- ✅ `AppFrame` mobile tab bar — added `aria-current="page"`, `aria-hidden` on icons and active indicator dot.

### Motion & Visual Accessibility
- ✅ Added `@media (prefers-reduced-motion: reduce)` in globals.css — disables all animations and transitions for users with vestibular sensitivities.
- ✅ Added `.sr-only` utility class for screen-reader-only text.
- ✅ Existing: `*:focus-visible` ring (emerald), skip-to-content link, 44px minimum tap targets.

## Phase 9: Data Visualization Dashboard ✅

- ✅ Created `DashboardAnalytics.tsx` with 4 executive analytics components using Mantine Charts.
- ✅ **Category Distribution** — Donut chart showing item count per category (11 categories, color-coded), with center label showing total count and legend grid.
- ✅ **Status Distribution** — Bar chart showing New/Reviewed/Completed/Ignored counts with value labels and rounded bars.
- ✅ **Financial Exposure** — Gauge bar with risk level (Low/Moderate/High), dollar total, color-coded fill, and per-category financial breakdown list.
- ✅ **Weekly Activity** — Stacked area chart with Processed/Pending/Flagged series, legend strip, and 7-day rolling window.
- ✅ Integrated all 4 charts into DashboardView as a responsive 4-column analytics grid below the metrics strip.
- ✅ All charts use consistent dark executive theme (bg-black/40, border-white/5, backdrop-blur-md).

## Quality Gates

- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- Manual browser review on desktop and mobile widths for any changed screen.


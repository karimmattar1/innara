# Innara -- Primer

## Current State
- **Phase:** Phase 4: Manager Portal + Billing — feature work complete, testing next
- **Last Updated:** 2026-03-29
- **Notion:** INN project (migrated from Linear)

## What's Done
- Phase 1: Foundation — completed 2026-03-28, passed phase review
- Phase 2: Core Features — completed 2026-03-29, passed phase review
- Phase 3: Supporting Features — completed 2026-03-29, review passed (score 71/100)

## Phase 4 Progress
**Wave 0 — Debt Cleanup (DONE):** Shared helpers, dead code removal, -469 lines

**Wave 1 — Backend Actions (DONE):** analytics.ts, staff-management.ts, billing.ts, branding.ts, email.ts, Stripe webhook

**Wave 2 — Manager Portal Core Screens (6 tickets, DONE):**
- INN-80: Manager Dashboard — KPI MetricCards, period selector, recent requests, quick actions
- INN-82: Manager Requests — filters, bulk ops, status transitions, pagination, staff assignment
- INN-83: Manager Analytics — recharts line/bar/area charts, staff performance table, revenue, SLA compliance
- INN-85: Manager Catalog — Menu items tab (category filter + grid), Services tab (CRUD dialog + inline Switch toggle)
- INN-87: Manager Staff — roster table, invite dialog, invitation management, department change, deactivate/reactivate
- INN-88: Manager Ops — SLA config with inline editing, color-coded target times, grouped by category

**Wave 3 — Manager Portal Additional Screens (7 tickets, DONE):**
- INN-95: Manager Billing — Stripe subscription management, plan selector, cancel with AlertDialog
- INN-96: Manager Branding — white-label config (logos, colors, fonts, CSS, welcome message, live preview)
- INN-98: Manager Permissions — static role-based permissions matrix, role description cards
- INN-100: Manager Go-Live Checklist — auto-verified + manual toggle items, progress bar, localStorage
- INN-102: Manager Settings + Health — hotel settings form, system health status cards
- INN-93: Manager Integrations — PMS, Stripe, Email, AI concierge cards + webhook status + API keys
- INN-120: Manager Profile — profile editing, password change, account info, danger zone

**Wave 4 — Cross-Cutting Features (6 tickets, DONE):**
- INN-139: Service hours server actions (schedule management, time-based availability)
- INN-140: Stripe webhook resilience (idempotency via audit_logs, failure alerting, retry-safe upserts)
- INN-143: Audit trail expansion (shared logAudit utility, staff/requests/orders audit logging)
- INN-105: Dynamic branding CSS injection (BrandingStyles server component, sanitized CSS vars, guest layout integration)
- INN-141: Invitation lifecycle (expiry checking, resend cooldown, duplicate prevention, manual expire)
- INN-145: Role change workflow (changeStaffRole, getStaffRole, JWT refresh note)

**Remaining Phase 4 tickets (testing/design):**
- INN-108: Manager portal E2E suite (19 screens) — Todo
- INN-94: Cross-portal integration E2E tests — Todo
- INN-11: Manager notification center design — Todo (not yet started)
- INN-8: Staff analytics design — **Design proposed, awaiting approval + spec write** (see below)
- INN-43: Staff analytics screen — Todo (blocked on INN-8)

**INN-8 Design Proposal (needs approval in next session):**
Layout: PageHeader + staff filter dropdown → 4 KPI cards → 2-col row → 2-col row → full-width bottom panel

- **Top bar:** Dynamic title (e.g. "Housekeeping Analytics"). Right side: staff member dropdown — defaults to "All Department", select individual to re-scope all metrics to that person.
- **4 KPI Cards:** Open Requests · SLA Compliance % · Avg Response Time (min) · Completion Rate %. Trend indicators on SLA and completion rate.
- **Row 1 (2-col):** Left = Task Breakdown (horizontal bar list, dept-scoped or individual). Right = Workload Overview (completion rate progress bar + status distribution New/In Progress/Completed).
- **Row 2 (2-col):** Left = Peak Hours (single recharts BarChart, x=hour, y=request count, bronze bars). Right = Response Time Breakdown (horizontal bars, <5m / 5-15m / 15-30m / >30m, green→red).
- **Bottom (full-width):** When all dept = Top Performing Staff (3-col grid, rank/name/tasks/avg time/rating). When individual selected = Recent Activity (last 10 requests for that person).
- Stays department-scoped only (no personal login-user stats — deferred since not all staff have individual accounts).
- Uses `glass-card-dark` + existing staff portal patterns (StaffHeader, PageContainer, PageHeader).

**Next session:** Present INN-8 design to Karim → approve → write spec doc → write implementation plan → build INN-43. Then design INN-11 (Manager notification center).

## Key Technical Notes
- **Next.js 16** (not 14) with React 19
- **Tailwind CSS v4** with shadcn base-nova style (@base-ui/react — NO `asChild` prop)
- **Shared PortalHeader** component with thin wrappers (StaffHeader, ManagerHeader, AdminHeader)
- **Shared helpers:** `src/lib/auth-context.ts` (auth), `src/lib/utils.ts` (formatting), `src/constants/app.ts` (transitions)
- **Shared audit:** `src/lib/audit.ts` (logAudit utility — fire-and-forget)
- **Dynamic branding:** `src/lib/branding.ts` + `src/components/innara/BrandingStyles.tsx` (guest portal CSS injection)
- Guest paths: /guest/*, Staff: /staff/*, Manager: /manager/*, Admin: /admin/*
- JWT claims inject app_role, hotel_id, department via custom_access_token_hook
- Middleware redirects: guest portal → /auth/guest/login, staff/manager/admin → /auth/staff/login
- Supabase project: hbqcujxpphwgkgrqpjmo (ap-south-1, ai-solutions org)
- RLS uses `is_manager_of_hotel()` SECURITY DEFINER function
- ROLES constant: GUEST, STAFF, FRONT_DESK, MANAGER, SUPER_ADMIN
- Playwright: port 3001 (avoid conflict with other ventures)

## Manual Steps Needed
- Enable JWT hook in Supabase Dashboard → Authentication → Hooks → Custom Access Token
- Set GitHub Secrets: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Configure Supabase email templates for verification + password reset

## Phase Progress
- [x] Phase 1: Foundation (22 tickets — completed 2026-03-28, review passed)
- [x] Phase 2: Core Features (29 tickets — completed 2026-03-29, review passed)
- [x] Phase 3: Supporting Features (20 tickets — completed 2026-03-29, review passed)
- [ ] Phase 4: Manager Portal + Billing (30 tickets — feature work done, testing remaining)
- [ ] Phase 5: Admin + PWA + PMS (23 tickets)
- [ ] Phase 6: Testing & Launch (18 tickets)

## Links
- Notion: https://www.notion.so/338364b9014781ff92fdeba0e8cf7bbe (INN project, migrated from Linear)
- GitHub: https://github.com/karimmattar1/innara
- Supabase: innara (ref: hbqcujxpphwgkgrqpjmo, region: ap-south-1, ai-solutions org)
- Figma: https://www.figma.com/design/p6rGnzuVAssEL9eCdq14RE/
- Staging: TBD (Vercel)
- Production: TBD

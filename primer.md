# Innara -- Primer

## Current State
- **Phase:** Phase 4: Manager Portal + Billing — feature work complete, INN-8 design approved, ready to build INN-43
- **Last Updated:** 2026-04-09
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
- INN-8: Staff analytics design — **✅ DONE 2026-04-09** — desktop layout approved, spec at `docs/planning/specs/inn-8-staff-analytics.md`
- INN-43: Staff analytics screen — **Ready to build** — plan at `docs/superpowers/plans/2026-04-09-inn-43-staff-analytics.md`

**INN-8 Resolution Summary (2026-04-09):**
Karim approved the desktop layout via AskUserQuestion. Key architectural decision: the staff portal is **desktop** per Innara CLAUDE.md (only Guest is mobile PWA), so the original ticket's "mobile-first per Stitch" wording is superseded. Final layout follows the Manager Analytics pattern: PageHeader + 4 KPI cards + 2-col panel rows + full-width recognition panel. Department-scoped only (no per-staff rating, no personal stats — deferred per spec §13). Spec written, Notion ticket updated to Done, Phase 4 parent table updated.

**Next session:** Build INN-43 per the plan. Start with the pre-written acceptance test (Rule 14, spec-first) → backend action → page component → visual verification. Then design INN-11 (Manager notification center) and resume testing tickets (INN-94, INN-108).

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

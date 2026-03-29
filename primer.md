# Innara -- Primer

## Current State
- **Phase:** Phase 3: Supporting Features — REVIEW PASSED (20/20), fixes applied
- **Last Updated:** 2026-03-29
- **Linear Team:** INN

## What's Done
- Phase 1: Foundation — completed 2026-03-28, passed phase review
- Phase 2: Core Features — completed 2026-03-29, passed phase review
- Phase 3: Supporting Features — completed 2026-03-29, review passed after 5 critical fixes

## Phase 3 Summary
**Wave 1 — Backend (5 tickets):** Staff server actions (staff.ts, messaging.ts, shifts.ts, claim-request.ts), enhanced RLS, optimistic locking
**Wave 2 — Staff Portal (6 tickets):** Dashboard, request queue, messaging, shift management, profile, seed data
**Wave 3 — Features (9 tickets):** Notifications (backend + drawer), break/away status, escalation, shift handoff, department scoping, request detail view, E2E + concurrency tests
**New files:** actions/{staff,messaging,shifts,claim-request,notifications,staff-status,escalation,shift-handoff}.ts, components/innara/NotificationDrawer.tsx, hooks/use-notifications.ts, staff portal pages (5), e2e/staff-portal.spec.ts, tests/concurrency/claim-race.test.ts
**Migrations:** enhanced_staff_rls, request_version_column, notifications_table, staff_availability_status, escalation_and_handoff
**Tests:** 73 Vitest (all pass), 70 Playwright specs

## Key Technical Notes
- **Next.js 16** (not 14) with React 19
- **Tailwind CSS v4** with shadcn base-nova style (@base-ui/react — NO `asChild` prop)
- **Shared PortalHeader** component with thin wrappers (StaffHeader, ManagerHeader, AdminHeader)
- Guest paths: /guest/*, Staff: /staff/*, Manager: /manager/*, Admin: /admin/*
- JWT claims inject app_role, hotel_id, department via custom_access_token_hook
- Middleware redirects: guest portal → /auth/guest/login, staff/manager/admin → /auth/staff/login
- Supabase project: hbqcujxpphwgkgrqpjmo (ap-south-1, ai-solutions org)
- RLS uses `is_manager_of_hotel()` SECURITY DEFINER function
- ROLES constant: GUEST, STAFF, FRONT_DESK, MANAGER, SUPER_ADMIN
- Stub API routes deleted — recreate when implementing features

## Manual Steps Needed
- Enable JWT hook in Supabase Dashboard → Authentication → Hooks → Custom Access Token
- Set GitHub Secrets: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Configure Supabase email templates for verification + password reset

## Phase Progress
- [x] Phase 1: Foundation (22 tickets — completed 2026-03-28, review passed)
- [x] Phase 2: Core Features (29 tickets — completed 2026-03-29, review passed)
- [x] Phase 3: Supporting Features (20 tickets — completed 2026-03-29, review passed)
- [ ] Phase 4: Manager Portal + Billing (30 tickets)
- [ ] Phase 5: Admin + PWA + PMS (23 tickets)
- [ ] Phase 6: Testing & Launch (18 tickets)

## Links
- Linear: INN team
- GitHub: https://github.com/karimmattar1/innara
- Supabase: innara (ref: hbqcujxpphwgkgrqpjmo, region: ap-south-1, ai-solutions org)
- Figma: https://www.figma.com/design/p6rGnzuVAssEL9eCdq14RE/
- Staging: TBD (Vercel)
- Production: TBD

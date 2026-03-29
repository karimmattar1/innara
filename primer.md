# Innara -- Primer

## Current State
- **Phase:** Phase 2: Core Features — ALL 29/29 COMPLETE, awaiting /phase-review
- **Last Updated:** 2026-03-28
- **Linear Team:** INN

## What's Done
- Phase 1: Foundation — completed 2026-03-28, passed phase review
- Phase 2: Core Features — completed 2026-03-28 (29/29 tickets across 3 waves)
  - Wave 1 (7 tickets): server actions (requests, orders, menu), welcome screen, services grid, stay verification, AI concierge API
  - Wave 2 (13 tickets): all guest screens (housekeeping, maintenance, service detail, requests list, request detail+timeline, room service menu+checkout, explore, profile, feedback, checkout), AI chat UI, realtime hooks
  - Wave 3 (9 tickets): QR codes, request reopen, AI fallback, order cancel guards, AI prompt injection protection, image upload, form idempotency, adversarial AI testing, E2E test suite

## What's Next
- Run /phase-review for Phase 2 (mandatory quality gate)
- Fix any critical issues from review
- Phase 3: Supporting Features (20 tickets — Staff portal screens, notifications, escalation, shifts)

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
- [ ] Phase 2: Core Features (29 tickets — Todo in Linear)
- [ ] Phase 3: Supporting Features (20 tickets)
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

# Innara -- Primer

## Current State
- **Phase:** Phase 2: Core Features — NOT STARTED
- **Last Updated:** 2026-03-28
- **Linear Team:** INN

## What's Done
- Phase 1: Foundation — completed 2026-03-28, passed phase review (codex + QA + scorer + self-learner)

## Phase 1 Review Summary
- Codex: PASS WITH NOTES (0 critical, 5 important, 5 minor)
- QA: PASS (0 critical, 4 important, 6 minor)
- Post-review fixes applied: deleted 5 stub API routes, fixed lastName verification in booking flow, fixed ROLES constant mismatch (5 roles not 4), standardized password min to 8 chars, fixed Logo image warning, added /api/health endpoint, fixed lint warnings

## What's Next (Phase 2: Core Features — 29 tickets)
Phase 2 builds the guest-facing experience and core backend:
- AI concierge (Claude API streaming + tools) — INN-38, INN-40
- Service requests (CRUD + real-time) — INN-20, INN-42, INN-45, INN-56, INN-59
- Room service (menu + checkout) — INN-23, INN-51, INN-53
- Guest screens (welcome, concierge grid, explore, profile, feedback, checkout) — INN-18, INN-30, INN-34, INN-48, INN-61, INN-62, INN-67, INN-118
- Server actions for orders — INN-22
- Realtime hooks — INN-70
- QR codes + deep links — INN-128
- Edge cases: request reopen (INN-129), AI fallback (INN-130), order cancellation (INN-131), AI security (INN-132), image upload (INN-133), form idempotency (INN-134), adversarial AI testing (INN-149)
- E2E test suite — INN-75

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

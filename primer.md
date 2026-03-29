# Innara -- Primer

## Current State
- **Phase:** Phase 4: Manager Portal + Billing — Wave 0 complete, Wave 1 next
- **Last Updated:** 2026-03-29
- **Linear Team:** INN

## What's Done
- Phase 1: Foundation — completed 2026-03-28, passed phase review
- Phase 2: Core Features — completed 2026-03-29, passed phase review
- Phase 3: Supporting Features — completed 2026-03-29, review passed (score 71/100)

## Phase 4 Progress
**Wave 0 — Debt Cleanup (1 ticket, DONE):**
- Extracted shared auth helpers → `src/lib/auth-context.ts` (resolveStaffContext, resolveHotelId, isManagerRole)
- Added shared formatting utils → `src/lib/utils.ts` (getTimeAgo, getInitials)
- Added VALID_TRANSITIONS to `src/constants/app.ts`
- Refactored 6 action files + 8 page/component files to use shared helpers
- Deleted dead code: ErrorBoundary.tsx, NavLink.tsx
- Converted concurrency test stubs to it.skip
- Net: -469 lines, 73 tests pass, build clean

## Key Technical Notes
- **Next.js 16** (not 14) with React 19
- **Tailwind CSS v4** with shadcn base-nova style (@base-ui/react — NO `asChild` prop)
- **Shared PortalHeader** component with thin wrappers (StaffHeader, ManagerHeader, AdminHeader)
- **Shared helpers:** `src/lib/auth-context.ts` (auth), `src/lib/utils.ts` (formatting), `src/constants/app.ts` (transitions)
- Guest paths: /guest/*, Staff: /staff/*, Manager: /manager/*, Admin: /admin/*
- JWT claims inject app_role, hotel_id, department via custom_access_token_hook
- Middleware redirects: guest portal → /auth/guest/login, staff/manager/admin → /auth/staff/login
- Supabase project: hbqcujxpphwgkgrqpjmo (ap-south-1, ai-solutions org)
- RLS uses `is_manager_of_hotel()` SECURITY DEFINER function
- ROLES constant: GUEST, STAFF, FRONT_DESK, MANAGER, SUPER_ADMIN
- Playwright: port 3001 (avoid conflict with other ventures)
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

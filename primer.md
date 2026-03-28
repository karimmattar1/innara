# Innara -- Primer

## Current State
- **Phase:** Phase 1: Foundation — COMPLETE
- **Last Updated:** 2026-03-28
- **Linear Team:** INN

## What's Done (Phase 1)
- INN-14: Next.js 16 project scaffolded with App Router
- INN-15: Tailwind v4, DM Sans, design tokens configured
- INN-16: 48 shadcn/ui components installed (base-nova style, @base-ui/react)
- INN-17: 42 custom Innara components migrated from design-static
- INN-19: Constants (app.ts 342 lines, navigation.ts), types (domain.ts 489 lines, database.ts auto-gen)
- INN-21: Supabase baseline schema — 29 tables with RLS
- INN-24: New tables (ai_conversations, ai_messages, subscriptions, audit_logs, hotel_branding, shifts, shift_assignments, integration_configs)
- INN-26: Custom JWT claims hook (custom_access_token_hook + 5 helper functions)
- INN-28: Supabase Auth client setup (@supabase/ssr, client + server)
- INN-32: Role-based middleware (JWT decoding, portal routing, PUBLIC_PATHS, admin redirect fix)
- INN-35: Guest login + registration pages (glassmorphism, form validation)
- INN-37: Staff/Manager login + invite accept page
- INN-41: Guest portal shell layout (gradient bg, mobile-first, AppBackground)
- INN-44: Staff portal shell layout (dark theme, StaffHeader)
- INN-47: Manager portal shell layout (dark theme, ManagerHeader)
- INN-49: Admin portal shell layout (dark theme, AdminHeader)
- INN-63: CI/CD — GitHub Actions (ci.yml + e2e.yml) + Vercel config
- INN-65: Auth E2E tests — 18 Playwright tests, all passing
- INN-116: Password reset flow (forgot password + reset confirmation pages)
- INN-117: Email verification flow — callback route + verify-email page (success/error states)
- INN-127: Guest booking ref verification — 3-step flow at /auth/guest/verify (booking ref → email → magic link)
- INN-148: RLS tenant isolation — tested with 2 hotels, 6 users. Found + fixed 20 policies with global manager access. Migration: fix_rls_manager_tenant_isolation. Added is_manager_of_hotel() SECURITY DEFINER function.
- Logo assets copied to public/ (4 files: icon + wordmark, light + dark)
- Sonner toast provider added to root layout
- Glassmorphism CSS (glass-card, glass-card-dark, glass-panel, gradient orbs, mobile-header, bottom-nav)
- Server actions: verifyBookingReference, sendGuestMagicLink (src/app/actions/auth.ts)

## What's Next
- Run `/phase-review` (codex-reviewer + qa-tester + scorer + self-learner)
- If phase passes: move Phase 2 tickets from Backlog → Todo
- Begin Phase 2: Core Features (AI concierge, service requests, room service)

## Key Technical Notes
- **Next.js 16** (not 14) with React 19
- **Tailwind CSS v4** with shadcn base-nova style (@base-ui/react — NO `asChild` prop)
- **Shared PortalHeader** component with thin wrappers (StaffHeader, ManagerHeader, AdminHeader)
- Guest paths: /guest/*, Staff: /staff/*, Manager: /manager/*, Admin: /admin/*
- JWT claims inject app_role, hotel_id, department via custom_access_token_hook
- Middleware redirects: guest portal → /auth/guest/login, staff/manager/admin → /auth/staff/login
- Supabase project: hbqcujxpphwgkgrqpjmo (ap-south-1, ai-solutions org)
- RLS uses `is_manager_of_hotel()` SECURITY DEFINER function to avoid infinite recursion on staff_assignments and scope managers to their hotel

## Manual Steps Needed
- Enable JWT hook in Supabase Dashboard → Authentication → Hooks → Custom Access Token
- Set GitHub Secrets: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- Configure Supabase email templates for verification + password reset

## Phase Progress
- [x] Phase 1: Foundation (22 tickets — complete 2026-03-28)
- [ ] Phase 2: Core Features (29 tickets)
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

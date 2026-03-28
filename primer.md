# Innara -- Primer

## Current State
- **Phase:** Phase 1: Foundation (in progress)
- **Last Updated:** 2026-03-27
- **Linear Team:** INN

## What's Done (Phase 1)
- P1-01 (INN-14): Next.js 16 project scaffolded with App Router ✅
- P1-02 (INN-15): Tailwind v4, DM Sans, design tokens configured ✅
- P1-03 (INN-16): 48 shadcn/ui components installed (base-nova style, @base-ui/react) ✅
- P1-04 (INN-17): 42/43 custom Innara components migrated from design-static ✅
- P1-05 (INN-18): Constants (app.ts 342 lines, navigation.ts), types (domain.ts 489 lines, database.ts auto-gen) ✅
- P1-06 (INN-19): Supabase baseline schema — 29 tables with RLS ✅
- P1-07 (INN-20): New tables (ai_conversations, ai_messages, subscriptions, audit_logs, hotel_branding, shifts, shift_assignments, integration_configs) ✅
- P1-08 (INN-21): Custom JWT claims hook (custom_access_token_hook + 5 helper functions) ✅
- P1-09 (INN-22): Supabase Auth client setup (@supabase/ssr) ✅
- P1-12 (INN-25): Role-based middleware (JWT decoding, portal routing, PUBLIC_PATHS) ✅
- P1-17 (INN-30): CI/CD — GitHub Actions (ci.yml + e2e.yml) + Vercel config ✅
- Types auto-generated from Supabase schema (database.ts 1,673 lines) ✅

## In Progress
- P1-04 remaining: 1 component left (RoomServiceCheckoutSheet — Phase 2 dependency, deferred)
- Portal shell layouts (INN-41, 44, 47, 49): Header/nav components ready, need layout wrappers
- Auth pages (INN-35, 37, 116, 117, 127): Not started

## What's Next
1. Build portal shell layouts (guest, staff, manager, admin)
2. Build auth pages (guest login/register, staff login, password reset, email verification, booking ref)
3. Auth E2E tests (INN-65)
4. RLS verification (INN-148)
5. Commit all component work

## Key Decisions
- Next.js 16 (not 14) — scaffold created with latest
- React 19 with Server Components by default
- Tailwind CSS v4 with shadcn base-nova style (@base-ui/react, NOT Radix — no `asChild` prop)
- Shared PortalHeader component with thin wrappers (StaffHeader, ManagerHeader, AdminHeader)
- Context hooks replaced with props for Next.js compatibility
- Design system: Navy #1a1d3a, Bronze #9B7340, DM Sans, glassmorphism
- Multi-tenant from day one (hotel_id + RLS on every table)

## Technical Notes
- shadcn base-nova uses @base-ui/react — DropdownMenuTrigger does NOT support `asChild`, pass className directly
- Guest paths are /guest/*, staff /staff/*, manager /manager/*, admin /admin/*
- JWT claims inject app_role, hotel_id, department via custom_access_token_hook
- Supabase project: hbqcujxpphwgkgrqpjmo (ap-south-1, ai-solutions org)

## Manual Steps Needed
- Enable JWT hook in Supabase Dashboard → Authentication → Hooks → Custom Access Token
- Set GitHub Secrets: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY

## Phase Progress
- [~] Phase 1: Foundation (22 tickets — ~12 done, ~10 remaining)
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

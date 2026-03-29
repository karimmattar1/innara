# Innara -- Primer

## Current State
- **Phase:** Phase 2: Core Features — Wave 1 COMPLETE, Wave 2 next
- **Last Updated:** 2026-03-28
- **Linear Team:** INN

## What's Done
- Phase 1: Foundation — completed 2026-03-28, passed phase review
- Phase 2 Wave 1 (7/29 tickets done):
  - INN-20: Request CRUD server actions (src/app/actions/requests.ts)
  - INN-22: Order CRUD server actions (src/app/actions/orders.ts)
  - INN-23: Menu query server actions (src/app/actions/menu.ts)
  - INN-18: Guest welcome screen (src/app/(guest)/welcome/page.tsx)
  - INN-30: Services grid screen (src/app/(guest)/services/page.tsx)
  - INN-34: Stay verification flow — verified complete from Phase 1
  - INN-38: AI concierge streaming API (src/app/api/ai/chat/route.ts + src/lib/ai/)

## What's Next (Phase 2 Wave 2 — 13 tickets)
Wave 2 builds on Wave 1's server actions + AI route:
- INN-40: AI concierge chat screen (depends on INN-38)
- INN-42: Housekeeping request screen (depends on INN-20)
- INN-45: Maintenance request screen (depends on INN-20)
- INN-48: Service detail screen (depends on INN-30)
- INN-51: Room service menu screen (depends on INN-23)
- INN-53: Room service checkout (depends on INN-22 + INN-51)
- INN-56: Guest requests list (depends on INN-20)
- INN-59: Request detail + timeline (depends on INN-20)
- INN-61: Guest explore screen
- INN-62: Guest profile screen
- INN-67: Guest feedback/ratings
- INN-70: Realtime hooks
- INN-118: Guest checkout/session end

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

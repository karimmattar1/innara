# Innara -- Primer

## Current State
- **Phase:** Pre-Phase 1 (scaffolded, not started)
- **Last Updated:** 2026-03-26
- **Linear Team:** INN

## What's Done
- Research complete (all 6 agents: market, competitor, legal, tech, business, GTM)
- 6-phase plan approved (102 tickets)
- Repo scaffolded with full project structure

## What's Next
- Phase 1: Foundation (~2.5 weeks, 18 tickets)
  - Supabase schema (baseline from existing migrations + new tables)
  - Auth (4 roles: guest, staff, manager, admin -- JWT custom claims)
  - Middleware (role-based routing to correct portal)
  - Component migration (91 components from innara-design-static)
  - Portal shell layouts (guest, staff, manager, admin)
  - CI/CD (GitHub Actions + Vercel)

## Key Decisions
- Full build: all 50 screens, ~15 weeks estimated
- Stack: Next.js 14+ / Supabase / Claude API / Stripe / Vercel
- Quality over speed -- absolute priority
- Figma pages with "-fix" suffix = final designs
- Existing component library (innara-design-static) to be migrated, not copied wholesale
- Design system: Navy #1a1d3a, Bronze #9B7340, DM Sans, glassmorphism
- Multi-tenant from day one (hotel_id + RLS on every table)
- 4 portals: Guest (mobile PWA), Staff (desktop), Manager (desktop), Admin (desktop)

## Phase Progress
- [ ] Phase 1: Foundation (18 tickets)
- [ ] Phase 2: Core Features (22 tickets)
- [ ] Phase 3: Management & Analytics (20 tickets)
- [ ] Phase 4: Advanced Features (18 tickets)
- [ ] Phase 5: Polish & Edge Cases (14 tickets)
- [ ] Phase 6: Testing & Launch (10 tickets)

## Blockers
- None currently

## Links
- Linear: INN team
- GitHub: https://github.com/karimmattar1/innara
- Figma: https://www.figma.com/design/p6rGnzuVAssEL9eCdq14RE/
- Staging: TBD (Vercel)
- Production: TBD

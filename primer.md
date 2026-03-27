# Innara -- Primer

## Current State
- **Phase:** Pre-Phase 1 (scaffolded, not started)
- **Last Updated:** 2026-03-26
- **Linear Team:** INN

## What's Done
- Research complete (all 6 agents: market, competitor, legal, tech, business, GTM)
- 6-phase plan approved (~147 tickets total: 102 original + 11 initial gaps + 13 user-flow gaps + 21 edge-case gaps)
- User-flow analysis complete (22 journeys, 121 scenarios, 35 gaps, 25+ Playwright specs) — see docs/planning/user-flows.md
- Comprehensive architecture doc (580 lines, 18 sections) — see docs/planning/architecture.md
- Database schema doc (28 tables, full RLS, triggers) — see docs/planning/database-schema.md
- Repo scaffolded with full project structure
- All Linear tickets created (INN-1 through INN-147) with labels, Phase 1 tickets in Todo

## What's Next
- Phase 1: Foundation (~2.5 weeks, 21 tickets)
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
- [ ] Phase 1: Foundation (21 tickets — 18 original + 3 gaps)
- [ ] Phase 2: Core Features (28 tickets — 20 original + 8 gaps)
- [ ] Phase 3: Supporting Features (19 tickets — 12 original + 7 gaps)
- [ ] Phase 4: Manager Portal + Billing (30 tickets — 24 original + 6 gaps)
- [ ] Phase 5: Admin + PWA + PMS (21 tickets — 14 original + 7 gaps)
- [ ] Phase 6: Testing & Launch (15 tickets — 14 original + 1 gap)

## Blockers
- None currently

## Links
- Linear: INN team
- GitHub: https://github.com/karimmattar1/innara
- Supabase: innara (ref: hbqcujxpphwgkgrqpjmo, region: ap-south-1, ai-solutions org)
- Figma: https://www.figma.com/design/p6rGnzuVAssEL9eCdq14RE/
- Staging: TBD (Vercel)
- Production: TBD

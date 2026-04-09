# SwampStudios — Ventures Registry

> Note: Existing ventures predate the `~/SwampStudios/ventures/` convention and remain at their original paths. New ventures created via `/new-venture` are scaffolded into `~/SwampStudios/ventures/`.

> Master list of all SwampStudios ventures. Keep this up to date as ventures progress.

## Active Ventures

| Venture | Industry | Stage | Status | Type |
|---------|----------|-------|--------|------|
| Innara | Hospitality | Scaffolded, Phase 1 not started | Active | B2B SaaS + AI |
| KorSync | E-commerce Tools | Testing | Active | B2B SaaS |
| KitchenKor | E-commerce / Retail | Live (Shopify) | Active | Dropshipping |
| YorKor | Business Intelligence | Early dev | Active | B2B SaaS |
| rabit | Construction | Figma-to-code done → Full dev | Active | B2B SaaS |
| casebase | Legal Tech | Early dev (buggy) | Active | B2B SaaS |
| fluo | Sports / Booking | Dev team building | Active | Consumer App |
| ACTL | Sports Community | Pre-launch | Active | White-label (fluo) |
| Second Serve | Sustainability / Sports | Operating business | Active | Physical + Site |
| 5senses | Furniture / Design | Close to live | Active | Landing + AI tools |
| SupraCitations | Legal Tech / EdTech | Scaffolded, Phase 1 in progress | Active | B2B + B2C SaaS |
| Acquire Weekly | M&A / Deal Sourcing | Scaffolded, Phase 1 not started | Active | B2B SaaS + AI |

---

### Innara
- **One-liner:** All-in-one hospitality platform — AI concierge for guests, management + analytics for hotels
- **Industry:** Hospitality
- **Stage:** Scaffolded — Phase 1 (Foundation) not started
- **Status:** Active (scaffolded 2026-03-26)
- **Repo:** `~/SwampStudios/ventures/innara`
- **GitHub:** https://github.com/karimmattar1/innara
- **Notion:** INN project
- **Supabase:** innara (ref: hbqcujxpphwgkgrqpjmo, region: ap-south-1, ai-solutions org)
- **Tech Stack:** Next.js 14+ (App Router), Supabase (PostgreSQL + Auth + Realtime + Storage + Edge Functions), Tailwind CSS + shadcn/ui, Claude API (Anthropic), Stripe, Resend, Upstash, Sentry, Vitest + Playwright, GitHub Actions + Vercel
- **Revenue Model:** B2B SaaS subscription to hotels — Starter $4/room/mo, Pro $8/room/mo, Enterprise $12-15/room/mo
- **Key Features:**
  - Guest portal: AI concierge, room service, service requests, explore nearby (mobile PWA)
  - Staff portal: Task queue, request management, shift view, messaging (desktop)
  - Manager portal: Operations dashboard, analytics, catalog management, staff management, reporting (desktop)
  - Admin portal: Tenant management, billing, user management (desktop)
- **Design:** Navy #1a1d3a, Bronze #9B7340, DM Sans, glassmorphism. Figma: https://www.figma.com/design/p6rGnzuVAssEL9eCdq14RE/
- **Key References:** `~/Desktop/innara-design-static` (component source), `~/Desktop/innara-service-hub-main/supabase/migrations/` (existing schema)
- **Key Numbers:** $6.12B TAM, 50 screens, 91 components, 102 tickets across 6 phases, ~15 weeks build
- **Next Steps:** Begin Phase 1 (Foundation) — Supabase schema, auth, middleware, component migration, portal shells, CI/CD

### KorSync
- **One-liner:** Universal web scraper that pulls e-commerce products from supplier sites and formats them as Shopify CSVs
- **Industry:** E-commerce Tools
- **Stage:** Testing phase
- **Status:** Active
- **Repo:** `~/Desktop/Kitchen Kor/kitchenkor-codebase/korsync-v2`
- **Tech Stack:** Python/FastAPI backend
- **Revenue Model:** SaaS subscription for e-commerce operators
- **Key Features:**
  - Universal scraping (works across supplier sites)
  - AI-powered product parsing
  - Shopify CSV export
  - Domain learning system
- **Next Steps:** Fix bugs from testing, prepare for production

### KitchenKor
- **One-liner:** E-commerce dropshipping store selling supplier products
- **Industry:** E-commerce / Retail
- **Stage:** Live on Shopify
- **Status:** Active — operating business
- **Platform:** Shopify (no custom codebase)
- **Revenue Model:** Dropshipping margins
- **Notes:** KorSync was built to support KitchenKor's product sourcing

### YorKor
- **One-liner:** AI-powered internal business hub that connects to everything and learns about every business
- **Industry:** Business Intelligence / Productivity
- **Stage:** Early development — hosted on Vercel, many bugs, far from production
- **Status:** Active
- **Repo:** `~/Desktop/YorKor`
- **Tech Stack:** Next.js + Supabase + Vercel
- **Revenue Model:** TBD — currently internal tool, potential B2B SaaS
- **Key Features:**
  - Connects to: email, documents, Slack, Git, WhatsApp, integrations
  - Per-business AI that learns everything about each business
  - Insights, active market research, financial analysis
  - Employee tracking (contracts, deadlines)
  - Lead detection from messages
  - Auto task creation
- **Next Steps:** Stabilize, fix bugs, improve per-business learning

### rabit
- **One-liner:** Construction SaaS — AI-powered BOQ parsing, vendor matching, and quote management for contractors
- **Industry:** Construction
- **Stage:** Advanced — sandbox demo built, Figma designed by design team, Figma-to-code complete
- **Status:** Active — full development starting week of 2026-03-21 with Karim + 2 engineers
- **Repo:** TBD (likely `~/rabit` or similar)
- **Tech Stack:** TBD (likely Next.js + Supabase)
- **Revenue Model:** B2B SaaS for contractors
- **Key Features:**
  - Upload BOQs → AI parses line items
  - Connects contractors to vendors in DB
  - Auto-sends inquiries to matched vendors
  - Vendors submit quotes → system ingests into contractor dashboard
  - Quote comparison and analysis
- **Next Steps:** Full MVP development from Figma screens

### casebase
- **One-liner:** Legal tech platform for law students (case briefs, essay prep) and paralegals (case management acceleration)
- **Industry:** Legal Tech / EdTech
- **Stage:** Early development — live on Vercel, many bugs
- **Status:** Active
- **Repo:** `~/Projects/casebase`
- **Tech Stack:** Next.js + Supabase + Vercel
- **Revenue Model:** B2B SaaS / B2C subscription
- **Key Features:**
  - Student side: Quick case brief summaries, in-depth case essay assistance
  - Paralegal side: Case management assistance, speeding up case review
  - AI-assisted, not replacing — augmenting legal work
- **Origin:** From JD candidate friend
- **Next Steps:** Fix bugs, stabilize core features

### fluo
- **One-liner:** Playtomic for all sports in the UAE — book sports, split payments
- **Industry:** Sports / Booking
- **Stage:** In development by external dev team
- **Status:** Active — targeting completion in ~1 month (by late April 2026)
- **Repo:** `~/Documents/fluo`
- **Revenue Model:** Marketplace / booking fees
- **Key Features:**
  - Multi-sport booking
  - Split payments between players
  - Court/venue management
- **Team:** External dev team (not Karim building directly)
- **Next Steps:** Dev team continues build, Karim reviews

### ACTL
- **One-liner:** Tennis community app for 100+ paying members in Dubai — white-label of fluo
- **Industry:** Sports Community
- **Stage:** Pre-launch — waiting for fluo platform to be ready
- **Status:** Active
- **Revenue Model:** Membership fees (already 100 paying members)
- **Key Features:** White-label fluo for closed ACTL community
- **Next Steps:** Launch once fluo platform is ready

### Second Serve
- **One-liner:** Padel and tennis sustainability company — recycles and repressurizes balls and cans in the UAE
- **Industry:** Sports / Sustainability
- **Stage:** Operating business
- **Status:** Active
- **Website:** www.secondserve.ae
- **Revenue Model:** Product sales / services
- **Notes:** Physical business, not a SaaS product. May need digital tools in future.

### 5senses
- **One-liner:** High-end Italian furniture distributor — Karim's mom's business, building new site with AI features
- **Industry:** Luxury Furniture / Design
- **Stage:** Site close to live on Lovable, preparing to push to production domain
- **Status:** Active
- **Repo:** `~/Desktop/5senses`
- **Staging:** fivesenses.lovable.app
- **Production:** 5sensesdesign.com (not yet deployed)
- **Tech Stack:** Lovable (may need migration for AI features)
- **Revenue Model:** Furniture distribution (B2B/B2C)
- **Key Features:**
  - Landing page / portfolio site
  - AI-assisted product management
  - Quote generation
- **Next Steps:** Finish Lovable build, push to 5sensesdesign.com, implement AI features

---

### SupraCitations (Supra)
- **One-liner:** AI-powered Bluebook legal citation formatter — hybrid LLM + deterministic rule engine for accurate citations
- **Industry:** Legal Tech / EdTech
- **Stage:** Scaffolded — Phase 1 (Foundation) in progress
- **Status:** Active (scaffolded 2026-03-22)
- **Repo:** `~/SwampStudios/ventures/supra`
- **Tech Stack:** Next.js 15, Supabase, Vercel, Tailwind + shadcn/ui, Claude API (Haiku 4.5), Stripe, Upstash Redis, Sentry, Vitest + Playwright
- **Revenue Model:** B2B + B2C SaaS subscription ($9.99/mo students, $29.99/mo pro, free tier 10/mo)
- **Key Features:**
  - Natural language citation input
  - Hybrid architecture: LLM extraction + deterministic rule engine formatting
  - 5 citation types: cases, federal statutes, state statutes (top 10), law reviews, books
  - Verification via CourtListener + Congress.gov
  - Citation projects and history
- **Origin:** Same network contact as casebase. Standalone first, potential future merge.
- **Key Numbers:** $644.7M TAM, break-even Month 3, 83-94% gross margins, ~$0.0015/citation LLM cost
- **Next Steps:** Complete Phase 1 (auth, layout, Stripe skeleton, landing page). Engage IP counsel ($8-15K) for Phase 2. Begin golden dataset curation.

---

### Acquire Weekly (AW)
- **One-liner:** AI-powered deal sourcing engine for SMB M&A — multi-source ingestion, AI scoring, chatbot, outreach, buyer matching, and self-learning analytics
- **Industry:** M&A / Deal Sourcing / FinTech
- **Stage:** Scaffolded — Phase 1 (Foundation) not started
- **Status:** Active (scaffolded 2026-03-26)
- **Repo:** `~/SwampStudios/ventures/acquire-weekly`
- **Linear Team:** AW
- **Tech Stack:** Next.js 15, Supabase (PostgreSQL + pgvector + Auth + RLS + pg_cron), Tailwind + shadcn/ui, Claude API (Haiku 4.5 scoring, Sonnet 4.6 chatbot), Resend, Upstash (QStash + Redis), Stripe, Vercel, Vitest + Playwright, Sentry, GitHub Actions
- **Revenue Model:** B2B SaaS subscription — $149/mo (Searcher), $349/mo (Pro), $699/mo (Team). No free tier (newsletter is the free tier).
- **Key Features:**
  - 8+ data sources (Empire Flippers, Acquire.com, Flippa, BizBuySell, Motion Invest, DealStream, manual, SOS records)
  - AI scoring engine (AW Score) — 6 dimensions for SMB, 5 for ecom, pgvector comps matching
  - AI chatbot with 11 tools — query deals, trigger actions, get insights conversationally
  - Cold outreach engine with CAN-SPAM compliance, Resend integration, AI-personalized sequences
  - Buyer matching with AI fit scoring, anonymous teasers, introduction requests
  - 9 self-learning pg_cron jobs — weight recalibration, dedup optimization, scraper health, data quality
  - Full analytics suite — pipeline funnel, scoring distribution, source breakdown, outreach performance
  - Multi-tenant from day one — org_id + RLS on every table, role-based access
- **Architecture:** Monolith + Job Queue — single Next.js app, background work via Supabase pg_cron → QStash job chains → Vercel serverless functions
- **Origin:** Network contact running Acquire Weekly newsletter (15K+ subscribers). Wants to turn deal-sourcing workflow into a platform.
- **Legal:** Must stay as "information platform" to avoid broker licensing in 17 states. AI scores labeled "indicative" not "valuations." Legal opinion needed ($3-8K).
- **Key Numbers:** 15K newsletter subscribers, ~130K SMB transactions/year in US, $149-699/mo pricing, estimated 60-ticket build across 6 phases
- **Next Steps:** Begin Phase 1 (Foundation) — install deps, create Supabase project, implement schema, auth, RLS, dashboard layout, Stripe, CI/CD

---

### SwampStudios Website
- **One-liner:** Parent company website for SwampStudios AI venture studio — dark, experimental, scroll-driven with 3D explorer, AI chatbot, and automated blog
- **Industry:** AI / Venture Studio
- **Stage:** Scaffolded — Phase 1 (Foundation) not started
- **Status:** Active (scaffolded 2026-03-26)
- **Repo:** `~/SwampStudios/ventures/swampstudios-website`
- **GitHub:** https://github.com/karimmattar1/swampstudios-website
- **Domain:** swampstudios.ai
- **Supabase:** swampstudios-website (ref: pjaarynjzzqmifgrdsiu, region: us-east-1, ai-solutions org)
- **Tech Stack:** Next.js 15, Tailwind v4 + shadcn/ui, GSAP + Lenis + Motion, Spline (3D), Supabase, Vercel AI SDK + Claude API, Resend, Upstash (Redis + QStash), Sentry, next-mdx-remote, Vitest + Playwright, GitHub Actions
- **Revenue Model:** Not SaaS — B2B lead generation through the website. Revenue comes from client engagements.
- **Key Features:**
  - Dark, experimental, scroll-driven design (Awwwards-quality)
  - 3D Spline venture explorer (progressive enhancement — 2D fallback)
  - AI chatbot (Claude Haiku 4.5 via Vercel AI SDK, streaming)
  - Automated blog pipeline (Claude Sonnet 4.6 via QStash, weekly drafts)
  - Live metrics from GitHub/Vercel APIs
  - Blog CMS with admin panel (MDX, Supabase Storage)
  - Contact form with Resend notifications
  - SEO optimized (sitemap, robots, JSON-LD, OG images)
- **Architecture:** Monolith — single Next.js app. Hybrid rendering (SSG + ISR + SSR). Animation stack: CSS -> Motion -> GSAP/ScrollTrigger -> Spline 3D.
- **Auth:** Admin-only (single user, Karim) for blog management. No public accounts.
- **Key Numbers:** 45 tickets across 6 phases, 12 ventures showcased, 7 database tables
- **Next Steps:** Begin Phase 1 (Foundation) — dark theme, base layout with header/footer, SEO, Playwright smoke tests

---

## Not a Venture

| Name | What It Is |
|------|-----------|
| Berkeley | Karim's masters degree program |
| SwampStudios Website | Parent company website — listed above as infrastructure, not a venture product |

## Stats

- **Total Ventures:** 12
- **Active:** 12
- **Pre-build:** 0
- **Live/Launched:** 2 (KitchenKor Shopify, Second Serve)
- **Close to Launch:** 2 (5senses, ACTL)
- **In Active Development:** 4 (Innara, KorSync, rabit, casebase)
- **Dev Team Building:** 1 (fluo)
- **Early Stage:** 1 (YorKor)
- **Recently Scaffolded:** 2 (SupraCitations, Acquire Weekly)
- **Revenue-Generating:** 3 (KitchenKor, Second Serve, ACTL memberships)
- **Studio Infrastructure:** 1 (SwampStudios Website — scaffolded)

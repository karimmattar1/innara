/**
 * RLS AUDIT — Innara Hospitality Platform
 * ========================================
 * Ticket: INN-123 (Phase 6 — Security Audit)
 * Date:   2026-04-11
 *
 * This file documents the expected RLS policies on every table in the Innara
 * database. It serves as a living checklist for verifying that Row Level
 * Security is correctly configured for multi-tenant isolation.
 *
 * Tables are categorized by sensitivity:
 *   - TENANT-SCOPED:   contains hotel_id; must isolate data per hotel
 *   - USER-SCOPED:     contains user_id; must isolate data per user
 *   - SYSTEM:          server-only access (audit_logs, subscriptions, etc.)
 *   - PUBLIC-READ:     public SELECT, restricted writes (rooms, menus, etc.)
 *
 * For each table, we document:
 *   - Whether RLS is enabled
 *   - Which roles should have SELECT / INSERT / UPDATE / DELETE
 *   - Any known gaps or concerns
 *
 * CRITICAL RULE (from BP-023): every table that accepts client-side INSERT
 * must have an explicit INSERT policy. Missing INSERT policies cause silent
 * failures that only surface with real browser clients (not service role).
 *
 * CRITICAL RULE (from TG-011): never test RLS with the service role key.
 * The service role bypasses all RLS. Only test with anon/authenticated role.
 */

// ---------------------------------------------------------------------------
// Types for the audit document
// ---------------------------------------------------------------------------

type RlsStatus = "enabled" | "disabled" | "unknown";
type PolicyStatus = "has_policy" | "missing" | "not_needed" | "service_role_only";
type Severity = "critical" | "high" | "medium" | "low" | "info";
type TableCategory = "tenant-scoped" | "user-scoped" | "system" | "public-read";

interface RlsAuditEntry {
  table: string;
  category: TableCategory;
  rlsEnabled: RlsStatus;
  hasHotelId: boolean;
  hasUserId: boolean;

  // Policy status per operation
  select: PolicyStatus;
  insert: PolicyStatus;
  update: PolicyStatus;
  delete: PolicyStatus;

  // Cross-org isolation test result
  crossOrgTested: boolean;

  // Notes and findings
  notes: string;
  findings: Array<{
    severity: Severity;
    description: string;
  }>;
}

// ---------------------------------------------------------------------------
// RLS Audit Registry
// ---------------------------------------------------------------------------

export const rlsAudit: RlsAuditEntry[] = [
  // =========================================================================
  // CORE USER TABLES
  // =========================================================================
  {
    table: "profiles",
    category: "user-scoped",
    rlsEnabled: "enabled",
    hasHotelId: false,
    hasUserId: true, // id = auth.uid()
    select: "has_policy",      // Authenticated users can view all profiles (USING(true) for authenticated)
    insert: "has_policy",      // Users can insert their own profile (auth_id = auth.uid())
    update: "has_policy",      // Users can update their own profile (id = auth.uid())
    delete: "not_needed",      // Profiles are never deleted from client (GDPR uses admin client)
    crossOrgTested: true,
    notes: "SELECT uses USING(true) for authenticated role. This is intentional — staff need to see guest names and contact info for messaging and request handling. PII fields (phone, email) are visible to all authenticated users.",
    findings: [
      {
        severity: "medium",
        description: "SELECT USING(true) exposes all profiles to any authenticated user across all hotels. A staff member at Hotel A can read profile data (email, phone, avatar) for guests at Hotel B. Consider hotel-scoped SELECT or restrict PII columns to same-hotel queries.",
      },
    ],
  },

  {
    table: "user_roles",
    category: "user-scoped",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: true,
    select: "has_policy",      // Users can view their own roles
    insert: "service_role_only",
    update: "service_role_only",
    delete: "service_role_only",
    crossOrgTested: true,
    notes: "Roles are managed by managers/admins via server actions that use the authenticated client. RLS correctly limits SELECT to own roles. INSERT/UPDATE/DELETE are handled by staff-management actions which query via the user's session (RLS applies).",
    findings: [],
  },

  // =========================================================================
  // HOTEL / PROPERTY TABLES
  // =========================================================================
  {
    table: "hotels",
    category: "public-read",
    rlsEnabled: "enabled",
    hasHotelId: true, // id IS the hotel_id
    hasUserId: false,
    select: "has_policy",      // Publicly viewable (hotels are listed publicly for guest login)
    insert: "service_role_only",
    update: "service_role_only",
    delete: "service_role_only",
    crossOrgTested: true,
    notes: "Hotels are public reference data. INSERT/UPDATE/DELETE only via admin actions (service role or admin-scoped authenticated).",
    findings: [],
  },

  {
    table: "rooms",
    category: "public-read",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: false,
    select: "has_policy",      // USING(true) — rooms are publicly viewable
    insert: "service_role_only",
    update: "service_role_only",
    delete: "service_role_only",
    crossOrgTested: false,
    notes: "Rooms are public reference data. SELECT USING(true) is appropriate. No client-side writes.",
    findings: [],
  },

  {
    table: "hotel_faqs",
    category: "tenant-scoped",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: false,
    select: "has_policy",
    insert: "service_role_only",
    update: "service_role_only",
    delete: "service_role_only",
    crossOrgTested: false,
    notes: "FAQs are read by the AI concierge and displayed to guests. Write operations via admin/manager actions.",
    findings: [],
  },

  {
    table: "hotel_branding",
    category: "tenant-scoped",
    rlsEnabled: "unknown",
    hasHotelId: true,
    hasUserId: false,
    select: "has_policy",
    insert: "service_role_only",
    update: "has_policy",
    delete: "not_needed",
    crossOrgTested: false,
    notes: "Branding is read by BrandingStyles component. Updates via manager branding actions.",
    findings: [
      {
        severity: "medium",
        description: "Cannot confirm RLS status from available migration files. Verify RLS is enabled and SELECT is scoped to hotel staff/guests only. Custom CSS field is sanitized in BrandingStyles.tsx but the sanitizer could be bypassed with novel CSS injection patterns.",
      },
    ],
  },

  // =========================================================================
  // STAFF TABLES
  // =========================================================================
  {
    table: "staff_assignments",
    category: "tenant-scoped",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: true,
    select: "has_policy",      // Staff can view their own assignments
    insert: "service_role_only",
    update: "has_policy",
    delete: "not_needed",
    crossOrgTested: true,
    notes: "SELECT scoped to own assignments. Managers use authenticated client to deactivate/reactivate staff — updates must verify hotel_id match.",
    findings: [],
  },

  {
    table: "staff_invitations",
    category: "tenant-scoped",
    rlsEnabled: "unknown",
    hasHotelId: true,
    hasUserId: false,
    select: "has_policy",
    insert: "has_policy",
    update: "has_policy",
    delete: "has_policy",
    crossOrgTested: false,
    notes: "Created in later migration. All operations go through staff-management.ts which uses resolveStaffContext to verify hotel_id. Application-level checks enforce manager role + hotel_id match.",
    findings: [
      {
        severity: "high",
        description: "Cannot confirm RLS is enabled from available migration files. This table contains invitation tokens and email addresses. If RLS is missing, any authenticated user could read invitations for other hotels including their tokens. MUST verify in database.",
      },
    ],
  },

  {
    table: "shift_assignments",
    category: "tenant-scoped",
    rlsEnabled: "unknown",
    hasHotelId: false,
    hasUserId: true,
    select: "has_policy",
    insert: "has_policy",
    update: "has_policy",
    delete: "not_needed",
    crossOrgTested: false,
    notes: "Used by shift-handoff.ts. RLS status needs database verification.",
    findings: [
      {
        severity: "medium",
        description: "Cannot confirm RLS status from available migration files. Verify RLS is enabled and policies restrict access to same-hotel staff.",
      },
    ],
  },

  // =========================================================================
  // GUEST TABLES
  // =========================================================================
  {
    table: "bookings",
    category: "tenant-scoped",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: true,
    select: "has_policy",      // Users can view their own bookings
    insert: "has_policy",      // Users can create their own bookings
    update: "has_policy",      // Users can update their own bookings
    delete: "not_needed",
    crossOrgTested: true,
    notes: "Scoped to user_id. Booking verification in auth.ts uses ilike without user_id filter, but this is pre-authentication (no user context yet).",
    findings: [],
  },

  {
    table: "stays",
    category: "tenant-scoped",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: true,
    select: "has_policy",      // Users can view their own stays
    insert: "has_policy",      // Users can create their own stays
    update: "service_role_only",
    delete: "not_needed",
    crossOrgTested: true,
    notes: "Core tenant isolation table. Guest actions query stays with user_id = auth.uid(). PMS webhook updates via admin client.",
    findings: [],
  },

  // =========================================================================
  // SERVICE REQUEST TABLES
  // =========================================================================
  {
    table: "requests",
    category: "tenant-scoped",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: true,
    select: "has_policy",      // Users can view their own requests
    insert: "has_policy",      // Users can create their own requests
    update: "has_policy",      // Users can update their own requests
    delete: "not_needed",
    crossOrgTested: true,
    notes: "Staff actions (staff.ts) use resolveStaffContext to verify hotel_id match. Guest actions filter by user_id. RLS provides defense-in-depth.",
    findings: [],
  },

  {
    table: "request_events",
    category: "tenant-scoped",
    rlsEnabled: "enabled",
    hasHotelId: false,
    hasUserId: false,
    select: "has_policy",      // Users can view events for their requests (via request join)
    insert: "has_policy",
    update: "not_needed",
    delete: "not_needed",
    crossOrgTested: false,
    notes: "Scoped through parent request. INSERT is used by staff actions when changing request status.",
    findings: [],
  },

  {
    table: "messages",
    category: "tenant-scoped",
    rlsEnabled: "enabled",
    hasHotelId: false,
    hasUserId: true, // sender_id
    select: "has_policy",      // Users can view messages for their requests
    insert: "has_policy",      // Users can send messages
    update: "not_needed",
    delete: "not_needed",
    crossOrgTested: false,
    notes: "Application layer (messaging.ts) enforces hotel_id match for staff and user_id match for guests. Internal messages are filtered for guest clients.",
    findings: [],
  },

  // =========================================================================
  // FOOD & BEVERAGE TABLES
  // =========================================================================
  {
    table: "menu_categories",
    category: "public-read",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: false,
    select: "has_policy",      // Publicly viewable (guests browse menu)
    insert: "service_role_only",
    update: "service_role_only",
    delete: "service_role_only",
    crossOrgTested: false,
    notes: "Menu data is read-only for clients. Managed via admin dashboard.",
    findings: [],
  },

  {
    table: "menu_items",
    category: "public-read",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: false,
    select: "has_policy",      // Publicly viewable
    insert: "service_role_only",
    update: "service_role_only",
    delete: "service_role_only",
    crossOrgTested: false,
    notes: "Menu items are read-only for clients. Application queries filter by hotel_id from the user's active stay.",
    findings: [],
  },

  {
    table: "orders",
    category: "tenant-scoped",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: true,
    select: "has_policy",      // Users can view their own orders
    insert: "has_policy",      // Users can create their own orders
    update: "has_policy",
    delete: "not_needed",
    crossOrgTested: true,
    notes: "All order actions use user_id = auth.uid() scoping. Hotel_id is derived from the user's active stay, not from client input.",
    findings: [],
  },

  {
    table: "order_items",
    category: "tenant-scoped",
    rlsEnabled: "enabled",
    hasHotelId: false,
    hasUserId: false,
    select: "has_policy",      // Users can view their order items (via order join)
    insert: "has_policy",      // Users can add items to their orders
    update: "not_needed",
    delete: "not_needed",
    crossOrgTested: false,
    notes: "Scoped through parent order. Application layer verifies order ownership before allowing item operations.",
    findings: [],
  },

  // =========================================================================
  // RATINGS
  // =========================================================================
  {
    table: "ratings",
    category: "tenant-scoped",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: true,
    select: "has_policy",      // Users can view their own ratings
    insert: "has_policy",      // Users can create ratings
    update: "not_needed",
    delete: "not_needed",
    crossOrgTested: false,
    notes: "Ratings are scoped to user_id. Analytics actions read ratings scoped to hotel_id via manager context.",
    findings: [],
  },

  // =========================================================================
  // CONFIGURATION TABLES
  // =========================================================================
  {
    table: "sla_configs",
    category: "public-read",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: false,
    select: "has_policy",      // USING(true) — publicly viewable
    insert: "service_role_only",
    update: "service_role_only",
    delete: "service_role_only",
    crossOrgTested: false,
    notes: "SLA configs are read by analytics. SELECT USING(true) is acceptable for this operational config data. Any authenticated user can read SLA targets for any hotel, but this is low-sensitivity data.",
    findings: [],
  },

  {
    table: "service_options",
    category: "public-read",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: false,
    select: "has_policy",      // USING(true) — publicly viewable
    insert: "service_role_only",
    update: "service_role_only",
    delete: "service_role_only",
    crossOrgTested: false,
    notes: "Service options are displayed to guests. Public read is appropriate.",
    findings: [],
  },

  {
    table: "service_time_options",
    category: "public-read",
    rlsEnabled: "enabled",
    hasHotelId: true,
    hasUserId: false,
    select: "has_policy",      // USING(true) — publicly viewable
    insert: "service_role_only",
    update: "service_role_only",
    delete: "service_role_only",
    crossOrgTested: false,
    notes: "Time-slot options for service scheduling. Public read is appropriate.",
    findings: [],
  },

  {
    table: "integration_configs",
    category: "tenant-scoped",
    rlsEnabled: "unknown",
    hasHotelId: true,
    hasUserId: false,
    select: "service_role_only",
    insert: "service_role_only",
    update: "service_role_only",
    delete: "not_needed",
    crossOrgTested: false,
    notes: "PMS integration config. Written by webhook handler via admin client. Contains sync status, provider details.",
    findings: [
      {
        severity: "medium",
        description: "Cannot confirm RLS status from available migration files. If RLS is disabled, any authenticated user could read integration configs (provider API details, sync status) for other hotels. MUST verify in database.",
      },
    ],
  },

  // =========================================================================
  // AI TABLES
  // =========================================================================
  {
    table: "ai_conversations",
    category: "user-scoped",
    rlsEnabled: "unknown",
    hasHotelId: true,
    hasUserId: true,
    select: "has_policy",
    insert: "has_policy",
    update: "not_needed",
    delete: "not_needed",
    crossOrgTested: false,
    notes: "Created in later migration. Chat API route verifies conversation ownership (user_id = auth.uid()) before returning messages. RLS should enforce at DB level.",
    findings: [
      {
        severity: "high",
        description: "Cannot confirm RLS is enabled from available migration files. This table contains AI conversation history which may include guest PII, requests, and hotel-specific information. If RLS is missing, any authenticated user could read another guest's AI conversations. MUST verify in database.",
      },
    ],
  },

  {
    table: "ai_messages",
    category: "user-scoped",
    rlsEnabled: "unknown",
    hasHotelId: false,
    hasUserId: false,
    select: "has_policy",
    insert: "has_policy",
    update: "not_needed",
    delete: "not_needed",
    crossOrgTested: false,
    notes: "Scoped through parent ai_conversations. Chat API route loads messages only for verified conversations.",
    findings: [
      {
        severity: "high",
        description: "Cannot confirm RLS is enabled from available migration files. Messages are scoped through conversation_id in application code, but without RLS, a crafted query could read messages from any conversation. MUST verify in database.",
      },
    ],
  },

  // =========================================================================
  // SYSTEM TABLES (server-only access)
  // =========================================================================
  {
    table: "audit_logs",
    category: "system",
    rlsEnabled: "unknown",
    hasHotelId: true,
    hasUserId: true, // actor_id
    select: "service_role_only",
    insert: "service_role_only",
    update: "not_needed",
    delete: "not_needed",
    crossOrgTested: false,
    notes: "Audit logs are written by server actions via the authenticated or admin client. Should have RLS enabled with NO client-facing policies (per BP-025 pattern). Service role bypasses RLS for writes.",
    findings: [
      {
        severity: "medium",
        description: "Audit logs are written using the authenticated client (via logAudit helper), not the admin client. This means INSERT must succeed for the authenticated role. Verify that the RLS INSERT policy allows authenticated users to write audit logs, OR refactor logAudit to use the admin client exclusively.",
      },
    ],
  },

  {
    table: "subscriptions",
    category: "tenant-scoped",
    rlsEnabled: "unknown",
    hasHotelId: true,
    hasUserId: false,
    select: "has_policy",
    insert: "service_role_only",
    update: "service_role_only",
    delete: "not_needed",
    crossOrgTested: false,
    notes: "Stripe webhook handler writes via admin client (service role). Manager billing actions read via authenticated client. SELECT must be scoped to the manager's hotel_id.",
    findings: [
      {
        severity: "high",
        description: "Cannot confirm RLS status from available migration files. Contains Stripe customer IDs, subscription details, and billing status. If RLS is missing, any authenticated user could read subscription data for other hotels including Stripe customer IDs. MUST verify in database.",
      },
    ],
  },

  {
    table: "waitlist",
    category: "public-read",
    rlsEnabled: "enabled",
    hasHotelId: false,
    hasUserId: false,
    select: "service_role_only",
    insert: "has_policy",      // WITH CHECK(true) — anyone can join
    update: "not_needed",
    delete: "not_needed",
    crossOrgTested: false,
    notes: "Public waitlist signup. INSERT WITH CHECK(true) is intentional for unauthenticated signups. No SELECT policy for clients, which is correct (users should not browse the waitlist).",
    findings: [],
  },
];

// ---------------------------------------------------------------------------
// Summary of findings
// ---------------------------------------------------------------------------

export const rlsAuditSummary = {
  totalTables: rlsAudit.length,

  tablesWithRlsEnabled: rlsAudit.filter((e) => e.rlsEnabled === "enabled").length,
  tablesWithRlsUnknown: rlsAudit.filter((e) => e.rlsEnabled === "unknown").length,
  tablesWithRlsDisabled: rlsAudit.filter((e) => e.rlsEnabled === "disabled").length,

  criticalFindings: rlsAudit.flatMap((e) =>
    e.findings.filter((f) => f.severity === "critical").map((f) => ({
      table: e.table,
      ...f,
    })),
  ),

  highFindings: rlsAudit.flatMap((e) =>
    e.findings.filter((f) => f.severity === "high").map((f) => ({
      table: e.table,
      ...f,
    })),
  ),

  mediumFindings: rlsAudit.flatMap((e) =>
    e.findings.filter((f) => f.severity === "medium").map((f) => ({
      table: e.table,
      ...f,
    })),
  ),

  // Tables that MUST be verified in the live database
  requiresDatabaseVerification: rlsAudit
    .filter((e) => e.rlsEnabled === "unknown")
    .map((e) => e.table),
};

// ---------------------------------------------------------------------------
// SQL queries to run against the live database for verification
// ---------------------------------------------------------------------------

export const verificationQueries = {
  /**
   * Query 1: List all tables with RLS status
   */
  listRlsStatus: `
    SELECT
      c.relname AS table_name,
      c.relrowsecurity AS rls_enabled,
      c.relforcerowsecurity AS rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
    ORDER BY c.relname;
  `,

  /**
   * Query 2: List all RLS policies per table with operation type
   */
  listPolicies: `
    SELECT
      schemaname,
      tablename,
      policyname,
      cmd AS operation,
      roles,
      qual AS using_clause,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, cmd;
  `,

  /**
   * Query 3: Find tables with USING(true) or WITH CHECK(true) — BP-025 audit
   */
  findPermissivePolicies: `
    SELECT
      tablename,
      policyname,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual = 'true' OR with_check = 'true')
    ORDER BY tablename;
  `,

  /**
   * Query 4: Find tables with RLS enabled but NO policies (service-role-only access)
   */
  findTablesWithNoPolicies: `
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
      AND NOT EXISTS (
        SELECT 1 FROM pg_policies p WHERE p.tablename = c.relname AND p.schemaname = 'public'
      )
    ORDER BY c.relname;
  `,

  /**
   * Query 5: Find tables WITHOUT RLS enabled (potential gaps)
   */
  findTablesWithoutRls: `
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = false
      AND c.relname NOT LIKE 'pg_%'
      AND c.relname NOT LIKE '_prisma_%'
    ORDER BY c.relname;
  `,

  /**
   * Query 6: Cross-org isolation test template
   *
   * Run this while authenticated as a user from Hotel A:
   */
  crossOrgIsolationTest: `
    -- Replace {hotel_b_id} with the ID of a DIFFERENT hotel
    -- All of these should return 0 rows for a properly isolated tenant:

    SELECT count(*) AS leaked_requests    FROM requests        WHERE hotel_id = '{hotel_b_id}';
    SELECT count(*) AS leaked_orders      FROM orders          WHERE hotel_id = '{hotel_b_id}';
    SELECT count(*) AS leaked_stays       FROM stays           WHERE hotel_id = '{hotel_b_id}';
    SELECT count(*) AS leaked_messages    FROM messages        WHERE request_id IN (
      SELECT id FROM requests WHERE hotel_id = '{hotel_b_id}'
    );
    SELECT count(*) AS leaked_ratings     FROM ratings         WHERE hotel_id = '{hotel_b_id}';
    SELECT count(*) AS leaked_staff       FROM staff_assignments WHERE hotel_id = '{hotel_b_id}';
  `,
};

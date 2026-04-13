/**
 * INPUT VALIDATION AUDIT — Innara Hospitality Platform
 * =====================================================
 * Ticket: INN-123 (Phase 6 — Security Audit)
 * Date:   2026-04-11
 *
 * Documents all user-facing inputs, their validation mechanisms, and
 * potential injection vectors (XSS, SQL injection, PostgREST filter
 * injection, CSS injection).
 *
 * Categories:
 *   SAFE:     Input is properly validated with Zod schema + sanitization
 *   CAUTION:  Input is validated but has a nuance worth documenting
 *   FINDING:  Input has a security concern that needs remediation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ValidationStatus = "safe" | "caution" | "finding";
type FindingSeverity = "critical" | "high" | "medium" | "low" | "info";
type InjectionVector = "xss" | "sql" | "postgrest-filter" | "css" | "path-traversal" | "open-redirect" | "command" | "none";

interface InputAuditEntry {
  /** File path relative to src/ */
  file: string;
  /** Function or component name */
  function: string;
  /** The input being validated */
  input: string;
  /** How it is validated */
  validationMethod: string;
  /** Overall status */
  status: ValidationStatus;
  /** Injection vectors tested/relevant */
  vectorsTested: InjectionVector[];
  /** Detailed notes */
  notes: string;
  /** Any findings */
  findings: Array<{
    severity: FindingSeverity;
    vector: InjectionVector;
    description: string;
  }>;
}

// ---------------------------------------------------------------------------
// Audit Registry
// ---------------------------------------------------------------------------

export const inputValidationAudit: InputAuditEntry[] = [
  // =========================================================================
  // API ROUTES
  // =========================================================================
  {
    file: "app/api/ai/chat/route.ts",
    function: "POST /api/ai/chat",
    input: "message, conversationId",
    validationMethod: "Zod: message z.string().min(1).max(2000), conversationId z.string().uuid().optional(). Adversarial input detection via detectAdversarialInput(). Sanitization via sanitizeUserInput(). AI response filtering via filterAIResponse().",
    status: "safe",
    vectorsTested: ["xss", "sql", "command"],
    notes: "Three-layer AI security pipeline: (1) adversarial detection rejects high-severity threats, (2) sanitization strips medium/low threats from user input, (3) response filtering on Claude output. getUser() used for authentication (not getSession()). Conversation ownership verified via user_id match.",
    findings: [],
  },

  {
    file: "app/api/health/route.ts",
    function: "GET /api/health",
    input: "none",
    validationMethod: "No user input accepted.",
    status: "caution",
    vectorsTested: ["none"],
    notes: "Returns { app, status, timestamp }. The 'app' field is hardcoded. The 'timestamp' field leaks server time but this is low risk.",
    findings: [
      {
        severity: "low",
        vector: "none",
        description: "Health endpoint returns 'app' and 'timestamp' fields beyond the minimal { status: 'ok' } pattern (BP-062). The timestamp could be used to correlate deployment events. Recommend removing 'app' and 'timestamp' fields, returning only { status: 'ok' }.",
      },
    ],
  },

  {
    file: "app/api/webhooks/stripe/route.ts",
    function: "POST /api/webhooks/stripe",
    input: "Raw request body (Stripe event payload)",
    validationMethod: "Stripe signature verification via stripe.webhooks.constructEvent(). Idempotency check via audit_logs.",
    status: "safe",
    vectorsTested: ["none"],
    notes: "Signature verification prevents forged payloads. Raw body used (request.text()) which is correct for Stripe verification. Idempotency prevents replay. Error messages do not leak internals. Follows RP-008 pattern exactly.",
    findings: [],
  },

  {
    file: "app/api/webhooks/pms/route.ts",
    function: "POST /api/webhooks/pms",
    input: "x-hotel-id header, x-pms-provider header, x-webhook-signature header, JSON body",
    validationMethod: "hotel_id validated with Zod UUID schema. Provider checked against allowlist ('mews' only). Webhook signature validated via mewsAdapter.validateWebhook(). Hotel existence verified in DB.",
    status: "safe",
    vectorsTested: ["sql"],
    notes: "Multiple validation layers. UUID format enforced on hotel_id. Provider restricted to 'mews'. Webhook signature verification. Hotel existence and active status checked. Admin client used for DB operations (correct for webhook handler).",
    findings: [],
  },

  // =========================================================================
  // AUTH CALLBACK
  // =========================================================================
  {
    file: "app/auth/callback/route.ts",
    function: "GET /auth/callback",
    input: "code (query param), next (query param — redirect URL)",
    validationMethod: "Open redirect protection: next must start with '/', must not start with '//', must not contain '://'. Falls back to '/guest' on failure.",
    status: "safe",
    vectorsTested: ["open-redirect"],
    notes: "Correctly implements BP-024 open redirect prevention. Tests relative path, protocol-relative, and protocol bypass. Default fallback is '/guest'. Does not decode before validation (potential encoded bypass). However, Next.js URL parsing already decodes percent-encoded characters in searchParams, so this is safe.",
    findings: [],
  },

  // =========================================================================
  // MIDDLEWARE
  // =========================================================================
  {
    file: "lib/supabase/middleware.ts",
    function: "updateSession",
    input: "pathname (from request URL), redirect query param (from URL)",
    validationMethod: "Pathname matched against PUBLIC_PATHS prefix list. Role extracted from JWT payload. Redirect set in query param.",
    status: "caution",
    vectorsTested: ["open-redirect"],
    notes: "Redirect param set by middleware when unauthenticated user visits protected path. The redirect value is the original pathname (starts with '/'), not user-controlled input from query params. However, the login page should validate this param before using it.",
    findings: [
      {
        severity: "medium",
        vector: "none",
        description: "Role is extracted from JWT via getSession() + manual base64url decode (line 96-109). Per BP-054, getSession() returns cached JWT which can contain stale role claims. This is acceptable in middleware for ROUTING purposes only (redirect staff to staff portal), but must NEVER be used for authorization decisions. The current usage is correct — it only determines which portal to redirect to, not whether the user can access data.",
      },
    ],
  },

  // =========================================================================
  // SERVER ACTIONS — GUEST FLOWS
  // =========================================================================
  {
    file: "app/actions/auth.ts",
    function: "verifyBookingReference",
    input: "confirmationNumber, lastName",
    validationMethod: "Zod: confirmationNumber z.string().min(1).max(50).trim(), lastName z.string().min(1).max(100).trim(). DB query uses .ilike() (parameterized by PostgREST).",
    status: "safe",
    vectorsTested: ["sql", "postgrest-filter"],
    notes: "Uses .ilike() method (not .or() string interpolation), which is parameterized. No injection risk. This is a pre-auth action — no user session exists. Rate limiting is recommended but not implemented (see below).",
    findings: [
      {
        severity: "medium",
        vector: "none",
        description: "No rate limiting on booking verification. An attacker could brute-force confirmation numbers. The response reveals whether a booking exists ('No active booking found'), enabling enumeration. Recommend rate limiting this endpoint and using a generic error message regardless of whether the confirmation number exists.",
      },
    ],
  },

  {
    file: "app/actions/auth.ts",
    function: "sendGuestMagicLink",
    input: "email, bookingId, hotelId",
    validationMethod: "Zod: email z.string().email(), bookingId z.string().uuid(), hotelId z.string().uuid().",
    status: "caution",
    vectorsTested: ["none"],
    notes: "Validation is correct. However, this action does not verify that the bookingId actually belongs to the provided email. An attacker who knows a bookingId could send magic links to any email address with that booking's metadata attached.",
    findings: [
      {
        severity: "medium",
        vector: "none",
        description: "sendGuestMagicLink does not verify that the email matches the booking's guest email. An attacker could send a magic link to their own email with a known booking ID, potentially gaining access to another guest's stay. The booking ID is passed to Supabase Auth as metadata (booking_id, hotel_id) which may be used for session context. Recommend verifying email matches the booking's guest_email before sending.",
      },
    ],
  },

  {
    file: "app/actions/requests.ts",
    function: "createRequest",
    input: "category, item, description, roomNumber, priority, photoUrls",
    validationMethod: "Zod: category z.enum(REQUEST_CATEGORIES), item z.string().min(1).max(200).trim(), description z.string().max(1000).trim(), roomNumber z.string().min(1).max(20).trim(), priority z.enum(REQUEST_PRIORITIES), photoUrls z.array(z.string().url()).max(5).",
    status: "safe",
    vectorsTested: ["xss", "sql"],
    notes: "All inputs validated via Zod. Hotel_id derived from user's active stay (not from client input). Uses getUser() for auth. Enum validation prevents arbitrary category/priority injection. Photo URLs validated as valid URL format.",
    findings: [],
  },

  {
    file: "app/actions/orders.ts",
    function: "createOrder",
    input: "items (array of {menuItemId, quantity, modifiers, specialInstructions}), paymentMethod, specialInstructions, tip",
    validationMethod: "Zod: menuItemId z.string().uuid(), quantity z.number().int().min(1).max(20), specialInstructions z.string().max(500), paymentMethod z.enum(['room_charge','card','cash']), tip z.number().min(0).max(10000).",
    status: "safe",
    vectorsTested: ["sql"],
    notes: "Comprehensive validation. Menu item existence verified against DB. Prices computed server-side from DB values (not client-submitted). Hotel_id from active stay. Tip has a max cap.",
    findings: [],
  },

  {
    file: "app/actions/messaging.ts",
    function: "sendMessage",
    input: "requestId, content, isInternal",
    validationMethod: "Zod: requestId z.string().uuid(), content z.string().min(1).max(2000).trim(), isInternal z.boolean().",
    status: "safe",
    vectorsTested: ["xss", "sql"],
    notes: "Authorization check verifies staff hotel_id match or guest request ownership. Internal messages restricted to staff only. Content is stored as plain text.",
    findings: [],
  },

  {
    file: "app/actions/uploads.ts",
    function: "getUploadUrl",
    input: "hotelId, mimeType, extension, fileSizeBytes",
    validationMethod: "Zod: hotelId z.string().uuid(), mimeType z.enum(ALLOWED_MIME_TYPES), extension z.enum(ALLOWED_EXTENSIONS), fileSizeBytes z.number().int().min(1).max(10MB).",
    status: "safe",
    vectorsTested: ["path-traversal"],
    notes: "File type restricted to image formats. Size limited to 10MB. Storage path built server-side using hotelId/userId/timestamp-random pattern (no client path input). Signed upload URL expires in 60 seconds.",
    findings: [],
  },

  {
    file: "app/actions/uploads.ts",
    function: "deleteUpload",
    input: "path",
    validationMethod: "Zod: path z.string().min(1).max(500) with refine(!includes('..')). User ID segment verified against auth.uid().",
    status: "safe",
    vectorsTested: ["path-traversal"],
    notes: "Path traversal prevention via '..' check. User ID segment must match authenticated user. Double protection against unauthorized deletion.",
    findings: [],
  },

  // =========================================================================
  // SERVER ACTIONS — STAFF FLOWS
  // =========================================================================
  {
    file: "app/actions/staff.ts",
    function: "getStaffRequests (search parameter)",
    input: "search: z.string().max(200)",
    validationMethod: "PostgREST special characters sanitized: search.replace(/[%_\\\\,().]/g, '\\\\$&'). Injected into .or() filter.",
    status: "caution",
    vectorsTested: ["postgrest-filter"],
    notes: "Sanitization addresses BP-053 (PostgREST filter injection). The regex strips %, _, \\, comma, parens, and dot. This covers the known PostgREST operators. The .or() call is: .or(`item.ilike.%${sanitized}%,description.ilike.%${sanitized}%`). The sanitization is present but the approach of interpolating into .or() remains inherently fragile — any new PostgREST syntax could introduce bypass vectors.",
    findings: [
      {
        severity: "low",
        vector: "postgrest-filter",
        description: "Search input is sanitized before interpolation into .or() filter, addressing BP-053. The sanitization regex covers known PostgREST operators. However, using an RPC function with parameterized SQL would be a more robust long-term solution that eliminates the interpolation entirely.",
      },
    ],
  },

  {
    file: "app/actions/staff-management.ts",
    function: "getStaffList (search parameter)",
    input: "search: z.string().max(200)",
    validationMethod: "PostgREST special characters sanitized: search.replace(/[%_\\\\,().]/g, '\\\\$&'). Injected into .or() filter.",
    status: "caution",
    vectorsTested: ["postgrest-filter"],
    notes: "Same sanitization pattern as staff.ts. .or() call: .or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`). Manager role verified via resolveStaffContext + isManagerRole before query executes.",
    findings: [],
  },

  {
    file: "app/actions/admin-users.ts",
    function: "searchUsers",
    input: "query: z.string().min(1).max(200), page, pageSize",
    validationMethod: "Sanitization: q.replace(/[%_\\\\]/g, ch => `\\\\${ch}`). Injected into .or() filter via admin client.",
    status: "caution",
    vectorsTested: ["postgrest-filter"],
    notes: "Sanitizes %, _, and \\ but does NOT sanitize comma, parens, or dot (unlike the staff.ts and staff-management.ts patterns). This is inconsistent and could allow PostgREST operator injection via these characters.",
    findings: [
      {
        severity: "medium",
        vector: "postgrest-filter",
        description: "admin-users.ts searchUsers sanitizes fewer PostgREST operators than staff.ts and staff-management.ts. Missing: comma (,), parentheses (()), and dot (.). An admin user could inject PostgREST filter syntax via these characters. While the impact is limited (admin context only, uses admin client which bypasses RLS), the inconsistency should be corrected. Use the same sanitization regex: /[%_\\\\,().]/g",
      },
    ],
  },

  {
    file: "app/actions/staff-management.ts",
    function: "inviteStaff",
    input: "email, role, department",
    validationMethod: "Zod: email z.string().email().max(255).transform(lowercase+trim), role z.enum(INVITABLE_ROLES), department z.enum(DEPARTMENTS).",
    status: "safe",
    vectorsTested: ["none"],
    notes: "Email normalized (lowercase, trimmed). Role restricted to allowed enum. Department restricted to enum. Duplicate invite check. Existing staff check. Token generated via crypto.getRandomValues(32 bytes). Manager authorization verified.",
    findings: [],
  },

  {
    file: "app/actions/claim-request.ts",
    function: "claimRequest, releaseRequest",
    input: "requestId, expectedVersion",
    validationMethod: "Zod: requestId z.string().uuid(), expectedVersion z.number().int().positive().",
    status: "safe",
    vectorsTested: ["none"],
    notes: "Optimistic locking via version check. Staff context verified. Hotel_id match enforced.",
    findings: [],
  },

  {
    file: "app/actions/escalation.ts",
    function: "escalateRequest",
    input: "requestId, reason",
    validationMethod: "Zod: requestId z.string().uuid(), reason z.string().min(1).max(500).trim().",
    status: "safe",
    vectorsTested: ["xss"],
    notes: "Reason text stored as plain text. Staff context verified.",
    findings: [],
  },

  // =========================================================================
  // SERVER ACTIONS — MANAGER FLOWS
  // =========================================================================
  {
    file: "app/actions/analytics.ts",
    function: "getDashboardStats, getRequestAnalytics, getStaffPerformance, getRevenueAnalytics",
    input: "period: z.enum(['today','week','month'])",
    validationMethod: "Zod enum validation. Manager role verified via resolveStaffContext + isManagerRole. Hotel_id from staff assignment (not client input).",
    status: "safe",
    vectorsTested: ["none"],
    notes: "Read-only actions. All data scoped to manager's hotel_id. Period restricted to enum values. No user-controlled data in queries beyond the period selector.",
    findings: [],
  },

  {
    file: "app/actions/billing.ts",
    function: "createCheckoutSession",
    input: "plan: 'starter' | 'pro' | 'enterprise'",
    validationMethod: "Validated against VALID_PLANS array. Manager context resolved.",
    status: "safe",
    vectorsTested: ["none"],
    notes: "Plan restricted to three valid values. Stripe checkout URL is generated server-side. Success/cancel URLs use NEXT_PUBLIC_APP_URL (environment variable, not user input).",
    findings: [],
  },

  // =========================================================================
  // SERVER ACTIONS — ADMIN FLOWS
  // =========================================================================
  {
    file: "app/actions/admin-users.ts",
    function: "deactivateUser, reactivateUser",
    input: "userId",
    validationMethod: "Zod: z.string().uuid(). Admin context resolved via resolveAdminContext (super_admin role verified from user_roles table).",
    status: "safe",
    vectorsTested: ["none"],
    notes: "UUID validated. Admin role verified from DB (not JWT). Operations use admin client for cross-hotel access. Audit logged.",
    findings: [],
  },

  {
    file: "app/actions/privacy.ts",
    function: "exportUserData, anonymizeUser, deactivateHotelCascade",
    input: "userId / hotelId",
    validationMethod: "Zod: z.string().uuid(). Admin context verified.",
    status: "safe",
    vectorsTested: ["none"],
    notes: "GDPR operations restricted to super_admin. Admin client used for cross-hotel operations. Cascade deactivation includes hotel, staff, subscription. All operations audit logged. Error handling reports to Sentry.",
    findings: [],
  },

  // =========================================================================
  // SERVER ACTIONS — QR CODE (getSession FINDING)
  // =========================================================================
  {
    file: "app/actions/qr.ts",
    function: "generateGuestEntryQR",
    input: "hotelId, roomNumber",
    validationMethod: "Zod: hotelId z.string().uuid(), roomNumber z.string().min(1).max(20).trim(). Auth via getUser(). Role check via getSession() JWT decode.",
    status: "finding",
    vectorsTested: ["none"],
    notes: "Uses getUser() for authentication (correct), but then calls getSession() to read the role from the JWT (incorrect per BP-054). The role claim in the JWT can be stale for up to 1 hour after a role change. A demoted staff member could continue generating QR codes with their old role.",
    findings: [
      {
        severity: "high",
        vector: "none",
        description: "qr.ts uses getSession() to read the user's role from the JWT for authorization (line 63-76). Per BP-054, this is a security vulnerability: if a user's role was downgraded in the database, the JWT retains the old role until it expires. Fix: replace the JWT-based role check with a database query to user_roles, consistent with the resolveStaffContext/isManagerRole pattern used in all other server actions.",
      },
    ],
  },

  // =========================================================================
  // DANGEROUSLYSETINNERHTML AUDIT
  // =========================================================================
  {
    file: "components/innara/BrandingStyles.tsx",
    function: "BrandingStyles",
    input: "Hotel branding data: primaryColor, accentColor, backgroundColor, fontHeading, fontBody, customCss",
    validationMethod: "Color: regex validation for hex format. Font: character allowlist (alphanumeric, spaces, commas, hyphens, quotes). CSS: strips HTML tags, expression(), javascript:, @import, data: URIs, behavior:.",
    status: "caution",
    vectorsTested: ["css", "xss"],
    notes: "dangerouslySetInnerHTML is intentional for injecting <style> tags. Sanitization is thorough but CSS injection is a complex attack surface. The sanitizer strips known dangerous patterns but novel CSS-based attacks could emerge.",
    findings: [
      {
        severity: "low",
        vector: "css",
        description: "Custom CSS sanitization covers known attack vectors (expression, javascript:, @import, data: URIs) but CSS is a broad attack surface. Consider using a CSS parser/validator library (e.g., css-tree) for more robust sanitization instead of regex-based stripping. Current approach is acceptable for launch but should be hardened post-launch.",
      },
    ],
  },

  {
    file: "components/ui/chart.tsx",
    function: "ChartStyle",
    input: "Chart theme configuration (hardcoded in config object, not user input)",
    validationMethod: "No user input. Colors come from the chart config object defined by developers.",
    status: "safe",
    vectorsTested: ["xss"],
    notes: "dangerouslySetInnerHTML is used to inject chart theme CSS variables. The content is derived from the THEMES constant and chart config — not from user-controlled data. Safe.",
    findings: [],
  },
];

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export const inputValidationSummary = {
  totalEntries: inputValidationAudit.length,
  safe: inputValidationAudit.filter((e) => e.status === "safe").length,
  caution: inputValidationAudit.filter((e) => e.status === "caution").length,
  finding: inputValidationAudit.filter((e) => e.status === "finding").length,

  allFindings: inputValidationAudit.flatMap((e) =>
    e.findings.map((f) => ({
      file: e.file,
      function: e.function,
      ...f,
    })),
  ),

  /** Actions that accept user input but are missing Zod validation */
  actionsWithoutZod: [
    // menu.ts getMenuCategories — no user input, only reads (no finding)
    // shift-handoff.ts — uses resolveStaffContext, no user text input beyond auth
  ],

  /** Server actions using getSession() for role checks (BP-054) */
  getSessionForRoleCheck: [
    "app/actions/qr.ts:generateGuestEntryQR — uses getSession() JWT for role authorization",
  ],

  /** .or() calls with string interpolation (BP-053) */
  orCallsWithInterpolation: [
    "app/actions/staff.ts:175 — sanitized (safe)",
    "app/actions/staff-management.ts:165 — sanitized (safe)",
    "app/actions/admin-users.ts:78 — partially sanitized (missing comma/parens/dot)",
  ],
};

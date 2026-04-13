# PII Data Protection Audit — Innara

## Audit Date: 2026-04-13
## Auditor: Automated + Manual Review

---

## 1. PII Data Inventory

### Tables Containing PII

| Table | PII Fields | RLS | Hotel Scoped |
|-------|-----------|-----|-------------|
| profiles | email, full_name, phone, avatar_url | Yes | No (user-scoped) |
| stays | user_id, room_number, check_in_date | Yes | Yes |
| requests | user_id, description | Yes | Yes |
| orders | user_id, total_amount | Yes | Yes |
| messages | sender_id, content | Yes | Yes |
| ai_conversations | user_id, title | Yes | Yes |
| ratings | user_id, comment | Yes | Yes |
| staff_assignments | user_id | Yes | Yes |
| user_roles | user_id, role | Yes | No |
| audit_logs | actor_id | Yes | Yes |

### PII Classification

- **High Sensitivity:** email, phone, full_name (direct identifiers)
- **Medium Sensitivity:** room_number, check_in_date, check_out_date (indirect identifiers)
- **Low Sensitivity:** request descriptions, ratings (user-generated content)

---

## 2. Multi-Tenant Isolation Verification

### RLS Enforcement
- All tables with hotel_id have RLS policies that filter by `auth.jwt() ->> 'hotel_id'`
- Admin queries use service role client (`createAdminClient()`) which bypasses RLS — restricted to `resolveAdminContext()` (super_admin only)
- Staff queries are scoped via `staff_assignments.hotel_id`

### Cross-Tenant Access Points (verified)
- [x] `getAdminTenants()` — uses service role, requires super_admin auth
- [x] `searchUsers()` — uses service role, requires super_admin auth
- [x] `exportUserData()` — uses service role, requires super_admin auth
- [x] `anonymizeUser()` — uses service role, requires super_admin auth
- [x] PMS webhook handler — validates hotel_id UUID, checks hotel exists

### Automated Tests
- `e2e/cross-tenant-isolation.spec.ts` — 12 tests covering auth boundaries, API isolation, PII exposure prevention
- `e2e/cross-portal.spec.ts` — 13 tests covering portal route separation

---

## 3. Data Flow Audit

### Guest PII Flow
1. Guest registers → `profiles` table (email, full_name)
2. Guest verified via booking ref → `stays` table linked
3. Guest makes requests → `requests` table (scoped to hotel via stay)
4. Guest uses AI concierge → `ai_conversations` + `messages` (scoped to hotel)
5. Guest rates service → `ratings` table

### Staff PII Access
- Staff see guest names and room numbers for their hotel only
- Staff cannot see guest email or phone (not exposed in staff UI)
- Staff cannot see other hotels' data (RLS enforced)

### Manager PII Access
- Managers see aggregated analytics (no individual PII)
- Managers see staff names for their hotel
- Managers cannot see guest personal data directly

### Admin PII Access
- Admins can search users across all hotels (super_admin only)
- Admin data export includes all PII for a specific user (GDPR Article 20)
- Admin anonymization redacts PII while preserving operational records

---

## 4. GDPR Compliance Status

| Requirement | Status | Implementation |
|------------|--------|----------------|
| Article 15: Right of access | Implemented | `exportUserData()` |
| Article 17: Right to erasure | Implemented | `anonymizeUser()` |
| Article 20: Data portability | Implemented | `exportUserData()` returns JSON |
| Article 25: Privacy by design | Implemented | RLS, hotel_id scoping |
| Article 32: Security of processing | Implemented | Encrypted at rest (Supabase), TLS in transit |
| Article 33: Breach notification | Manual | Sentry alerting configured |

---

## 5. Findings

### No Critical Findings

### Medium Findings
1. **No data retention policy** — PII is stored indefinitely. Recommend implementing automated cleanup after stay checkout + 90 days.
2. **Audit logs contain actor_id** — This is necessary for accountability but creates a link between admin actions and user identities.

### Low Findings
1. **AI conversation content stored in full** — Consider implementing content redaction after 30 days for conversations containing PII.
2. **Profile photos (avatar_url)** stored in Supabase Storage — ensure bucket-level access controls are configured.

---

## 6. Recommendations

1. Implement automated PII retention schedule (90 days post-checkout)
2. Add content redaction for AI conversations after 30 days
3. Configure Supabase Storage bucket policies for avatar uploads
4. Add PII access logging to audit trail (who viewed what guest data)
5. Schedule quarterly PII audit reviews

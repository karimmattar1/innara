import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Service-role client — bypasses RLS for cross-tenant admin queries.
// Lazy-initialized to avoid throwing during `next build` page-data collection
// when SUPABASE_SERVICE_ROLE_KEY is absent from the build environment.
//
// IMPORTANT: Never import this module in browser-accessible code.
// The service role key must never be exposed to the client.
// ---------------------------------------------------------------------------

let adminClient: SupabaseClient | null = null;

export function createAdminClient(): SupabaseClient {
  if (adminClient) return adminClient;
  adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
  return adminClient;
}

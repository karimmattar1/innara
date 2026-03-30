import { SupabaseClient } from "@supabase/supabase-js";

export interface AuditEntry {
  hotelId: string | null;
  actorId: string | null;
  action: string;
  tableName: string;
  recordId: string;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

export async function logAudit(
  supabase: SupabaseClient,
  entry: AuditEntry,
): Promise<void> {
  // Fire-and-forget — audit logging should never block the main operation
  await supabase.from("audit_logs").insert({
    hotel_id: entry.hotelId,
    actor_id: entry.actorId,
    action: entry.action,
    table_name: entry.tableName,
    record_id: entry.recordId,
    old_data: entry.oldData ?? null,
    new_data: entry.newData ?? null,
  }).then(({ error }) => {
    if (error) {
      console.error("[audit] Failed to log:", error.message);
    }
  });
}

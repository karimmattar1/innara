import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

// ---------------------------------------------------------------------------
// PMS conflict resolver — handles divergent state between PMS and Innara
// ---------------------------------------------------------------------------

export interface ConflictRecord {
  id: string;
  hotelId: string;
  externalReservationId: string;
  field: string;
  pmsValue: string;
  innaraValue: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolution: "use_pms" | "keep_innara" | null;
  createdAt: string;
}

export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflicts: Array<{
    field: string;
    pmsValue: string;
    innaraValue: string;
  }>;
}

// ---------------------------------------------------------------------------
// detectConflicts — compare PMS data with Innara data
// ---------------------------------------------------------------------------

export function detectConflicts(
  pmsData: Record<string, string | null>,
  innaraData: Record<string, string | null>,
  fieldsToCheck: string[],
): ConflictDetectionResult {
  const conflicts: ConflictDetectionResult["conflicts"] = [];

  for (const field of fieldsToCheck) {
    const pmsVal = pmsData[field] ?? null;
    const innaraVal = innaraData[field] ?? null;

    if (pmsVal !== innaraVal && pmsVal !== null && innaraVal !== null) {
      conflicts.push({
        field,
        pmsValue: pmsVal,
        innaraValue: innaraVal,
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

// ---------------------------------------------------------------------------
// resolveConflict — apply resolution to a specific conflict
// ---------------------------------------------------------------------------

export async function resolveConflict(
  hotelId: string,
  externalReservationId: string,
  field: string,
  resolution: "use_pms" | "keep_innara",
  pmsValue: string,
  resolvedBy: string,
): Promise<{ success: boolean; error?: string }> {
  const adminClient = createAdminClient();

  try {
    if (resolution === "use_pms") {
      // Update the Innara record with PMS value
      const { error } = await adminClient
        .from("stays")
        .update({
          [field]: pmsValue,
          updated_at: new Date().toISOString(),
        })
        .eq("hotel_id", hotelId)
        .eq("external_reservation_id", externalReservationId);

      if (error) {
        return { success: false, error: error.message };
      }
    }
    // If "keep_innara", no DB update needed — we just mark it resolved

    await logAudit(adminClient, {
      hotelId,
      actorId: resolvedBy,
      action: "pms.conflict_resolved",
      tableName: "stays",
      recordId: externalReservationId,
      newData: { field, resolution, pmsValue },
    });

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: msg };
  }
}

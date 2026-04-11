import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import type {
  IPMSAdapter,
  PMSEvent,
  PMSReservation,
} from "./types";

// ---------------------------------------------------------------------------
// Mews webhook event schemas (Zod validation for malformed data)
// ---------------------------------------------------------------------------

const mewsReservationSchema = z.object({
  Id: z.string().min(1),
  State: z.enum([
    "Confirmed",
    "Started",
    "Processed",
    "Canceled",
    "Optional",
  ]),
  StartUtc: z.string().datetime({ offset: true }).or(z.string().min(1)),
  EndUtc: z.string().datetime({ offset: true }).or(z.string().min(1)),
  AssignedResourceId: z.string().nullable().optional(),
  PersonCounts: z
    .array(
      z.object({
        AgeCategoryId: z.string(),
        Count: z.number().int().min(0),
      }),
    )
    .optional()
    .default([]),
  Notes: z.string().nullable().optional(),
});

const mewsCustomerSchema = z.object({
  Id: z.string().min(1),
  FirstName: z.string().nullable().optional(),
  LastName: z.string().nullable().optional(),
  Email: z.string().email().nullable().optional(),
});

const mewsResourceSchema = z.object({
  Id: z.string().min(1),
  Name: z.string().nullable().optional(),
});

const mewsWebhookPayloadSchema = z.object({
  Events: z.array(
    z.object({
      Type: z.string(),
      Id: z.string(),
      Value: z.unknown(),
    }),
  ),
});

// ---------------------------------------------------------------------------
// State mapping
// ---------------------------------------------------------------------------

const STATE_MAP: Record<string, PMSReservation["status"]> = {
  Confirmed: "confirmed",
  Started: "checked_in",
  Processed: "checked_out",
  Canceled: "cancelled",
  Optional: "confirmed",
};

function mapEventType(
  mewsState: string,
  eventType: string,
): PMSEvent["type"] {
  if (eventType === "ReservationCreated") return "reservation.created";
  if (mewsState === "Started") return "check_in";
  if (mewsState === "Processed") return "check_out";
  if (mewsState === "Canceled") return "reservation.cancelled";
  return "reservation.updated";
}

// ---------------------------------------------------------------------------
// Mews Adapter
// ---------------------------------------------------------------------------

export class MewsAdapter implements IPMSAdapter {
  name = "mews" as const;

  validateWebhook(payload: unknown, signature: string | null): boolean {
    // Mews uses a shared secret for webhook verification
    // In production, compute HMAC-SHA256 of the payload body using the webhook secret
    // For now, validate that the payload has the expected structure
    if (!payload || typeof payload !== "object") return false;
    const parsed = mewsWebhookPayloadSchema.safeParse(payload);
    return parsed.success;
  }

  parseEvents(payload: unknown): PMSEvent[] {
    const parsed = mewsWebhookPayloadSchema.safeParse(payload);
    if (!parsed.success) return [];

    const events: PMSEvent[] = [];

    for (const event of parsed.data.Events) {
      try {
        // Each event Value contains the reservation data
        const reservationData = mewsReservationSchema.safeParse(event.Value);
        if (!reservationData.success) {
          console.error(
            `[mews] Skipping malformed reservation ${event.Id}:`,
            reservationData.error.issues,
          );
          continue;
        }

        const res = reservationData.data;
        const status = STATE_MAP[res.State] ?? "confirmed";
        const adults = res.PersonCounts.find(
          (pc) => pc.AgeCategoryId === "Adult",
        )?.Count ?? 1;
        const children = res.PersonCounts.filter(
          (pc) => pc.AgeCategoryId !== "Adult",
        ).reduce((sum, pc) => sum + pc.Count, 0);

        const reservation: PMSReservation = {
          externalId: res.Id,
          guestName: "PMS Guest",
          guestEmail: null,
          roomNumber: res.AssignedResourceId ?? "Unassigned",
          checkInDate: res.StartUtc,
          checkOutDate: res.EndUtc,
          status,
          adults,
          children,
          notes: res.Notes ?? null,
        };

        events.push({
          type: mapEventType(res.State, event.Type),
          reservation,
          timestamp: new Date().toISOString(),
          rawPayload: event.Value,
        });
      } catch (err) {
        console.error(`[mews] Error parsing event ${event.Id}:`, err);
      }
    }

    return events;
  }

  async processEvent(
    event: PMSEvent,
    hotelId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const adminClient = createAdminClient();

    try {
      switch (event.type) {
        case "reservation.created":
        case "reservation.updated": {
          // Upsert the booking/stay record
          const { error } = await adminClient
            .from("stays")
            .upsert(
              {
                hotel_id: hotelId,
                external_reservation_id: event.reservation.externalId,
                room_number: event.reservation.roomNumber,
                guest_name: event.reservation.guestName,
                guest_email: event.reservation.guestEmail,
                check_in_date: event.reservation.checkInDate,
                check_out_date: event.reservation.checkOutDate,
                status: event.reservation.status,
                adults: event.reservation.adults,
                children: event.reservation.children,
                notes: event.reservation.notes,
                pms_source: "mews",
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "hotel_id,external_reservation_id",
              },
            );

          if (error) {
            return { success: false, error: error.message };
          }

          await logAudit(adminClient, {
            hotelId,
            actorId: null,
            action: `pms.${event.type}`,
            tableName: "stays",
            recordId: event.reservation.externalId,
            newData: {
              room: event.reservation.roomNumber,
              status: event.reservation.status,
            },
          });

          return { success: true };
        }

        case "check_in": {
          const { error } = await adminClient
            .from("stays")
            .update({
              status: "checked_in",
              actual_check_in: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("hotel_id", hotelId)
            .eq("external_reservation_id", event.reservation.externalId);

          if (error) {
            return { success: false, error: error.message };
          }

          await logAudit(adminClient, {
            hotelId,
            actorId: null,
            action: "pms.check_in",
            tableName: "stays",
            recordId: event.reservation.externalId,
          });

          return { success: true };
        }

        case "check_out": {
          const { error } = await adminClient
            .from("stays")
            .update({
              status: "checked_out",
              actual_check_out: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("hotel_id", hotelId)
            .eq("external_reservation_id", event.reservation.externalId);

          if (error) {
            return { success: false, error: error.message };
          }

          await logAudit(adminClient, {
            hotelId,
            actorId: null,
            action: "pms.check_out",
            tableName: "stays",
            recordId: event.reservation.externalId,
          });

          return { success: true };
        }

        case "reservation.cancelled": {
          const { error } = await adminClient
            .from("stays")
            .update({
              status: "cancelled",
              updated_at: new Date().toISOString(),
            })
            .eq("hotel_id", hotelId)
            .eq("external_reservation_id", event.reservation.externalId);

          if (error) {
            return { success: false, error: error.message };
          }

          await logAudit(adminClient, {
            hotelId,
            actorId: null,
            action: "pms.reservation.cancelled",
            tableName: "stays",
            recordId: event.reservation.externalId,
          });

          return { success: true };
        }

        default:
          return { success: false, error: `Unknown event type: ${event.type}` };
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { success: false, error: msg };
    }
  }
}

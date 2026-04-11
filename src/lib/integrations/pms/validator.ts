import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

// ---------------------------------------------------------------------------
// PMS data validator — catches malformed webhook payloads before processing
// ---------------------------------------------------------------------------

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: Array<{
    field: string;
    message: string;
    received: unknown;
  }>;
}

const reservationFieldSchema = z.object({
  Id: z.string().min(1, "Reservation ID is required"),
  State: z.string().min(1, "State is required"),
  StartUtc: z.string().min(1, "Check-in date is required"),
  EndUtc: z.string().min(1, "Check-out date is required"),
});

export function validateMewsReservation(
  payload: unknown,
): ValidationResult<z.infer<typeof reservationFieldSchema>> {
  const result = reservationFieldSchema.safeParse(payload);

  if (result.success) {
    return { success: true, data: result.data, errors: [] };
  }

  const errors = result.error.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
    received: issue.path.reduce(
      (obj: unknown, key) =>
        obj && typeof obj === "object" ? (obj as Record<string, unknown>)[key as string] : undefined,
      payload,
    ),
  }));

  return { success: false, errors };
}

// ---------------------------------------------------------------------------
// logSyncError — persist PMS sync errors for admin visibility
// ---------------------------------------------------------------------------

export interface SyncError {
  hotelId: string;
  provider: string;
  externalId: string;
  errorType: "validation" | "processing" | "timeout" | "unknown";
  errorMessage: string;
  rawPayload: unknown;
  timestamp: string;
}

export function createSyncError(
  hotelId: string,
  provider: string,
  externalId: string,
  errorType: SyncError["errorType"],
  errorMessage: string,
  rawPayload: unknown,
): SyncError {
  const error: SyncError = {
    hotelId,
    provider,
    externalId,
    errorType,
    errorMessage,
    rawPayload,
    timestamp: new Date().toISOString(),
  };

  Sentry.captureMessage("PMS sync error", {
    level: "warning",
    tags: { provider, hotelId, errorType },
    extra: { externalId, errorMessage },
  });

  return error;
}

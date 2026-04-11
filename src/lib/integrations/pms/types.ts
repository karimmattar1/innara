// ---------------------------------------------------------------------------
// PMS integration types — shared across all PMS adapters
// ---------------------------------------------------------------------------

export interface PMSReservation {
  externalId: string;
  guestName: string;
  guestEmail: string | null;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled" | "no_show";
  adults: number;
  children: number;
  notes: string | null;
}

export interface PMSEvent {
  type:
    | "reservation.created"
    | "reservation.updated"
    | "check_in"
    | "check_out"
    | "reservation.cancelled";
  reservation: PMSReservation;
  timestamp: string;
  rawPayload: unknown;
}

export interface PMSAdapterConfig {
  hotelId: string;
  apiKey: string;
  propertyId: string;
  webhookSecret?: string;
}

export interface PMSSyncResult {
  success: boolean;
  eventsProcessed: number;
  errors: Array<{
    externalId: string;
    error: string;
  }>;
}

export interface IPMSAdapter {
  name: string;
  validateWebhook(payload: unknown, signature: string | null): boolean;
  parseEvents(payload: unknown): PMSEvent[];
  processEvent(event: PMSEvent, hotelId: string): Promise<{ success: boolean; error?: string }>;
}

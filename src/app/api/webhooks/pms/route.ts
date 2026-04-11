import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { MewsAdapter } from "@/lib/integrations/pms/mews-adapter";
import type { PMSSyncResult } from "@/lib/integrations/pms/types";

// ---------------------------------------------------------------------------
// PMS webhook handler — processes incoming events from PMS providers
// ---------------------------------------------------------------------------

const mewsAdapter = new MewsAdapter();

export async function POST(request: NextRequest): Promise<NextResponse> {
  const hotelId = request.headers.get("x-hotel-id");
  const provider = request.headers.get("x-pms-provider") ?? "mews";
  const signature = request.headers.get("x-webhook-signature");

  if (!hotelId) {
    return NextResponse.json(
      { error: "Missing x-hotel-id header" },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  // Select adapter based on provider
  if (provider !== "mews") {
    return NextResponse.json(
      { error: `Unsupported PMS provider: ${provider}` },
      { status: 400 },
    );
  }

  // Validate webhook
  if (!mewsAdapter.validateWebhook(body, signature)) {
    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 },
    );
  }

  // Verify hotel exists and has PMS integration enabled
  const adminClient = createAdminClient();
  const { data: hotel, error: hotelError } = await adminClient
    .from("hotels")
    .select("id, is_active")
    .eq("id", hotelId)
    .maybeSingle();

  if (hotelError || !hotel) {
    return NextResponse.json(
      { error: "Hotel not found" },
      { status: 404 },
    );
  }

  if (!hotel.is_active) {
    return NextResponse.json(
      { error: "Hotel is inactive" },
      { status: 403 },
    );
  }

  // Parse and process events
  const events = mewsAdapter.parseEvents(body);

  if (events.length === 0) {
    return NextResponse.json(
      { success: true, eventsProcessed: 0, errors: [] },
      { status: 200 },
    );
  }

  const result: PMSSyncResult = {
    success: true,
    eventsProcessed: 0,
    errors: [],
  };

  for (const event of events) {
    const processResult = await mewsAdapter.processEvent(event, hotelId);
    if (processResult.success) {
      result.eventsProcessed++;
    } else {
      result.errors.push({
        externalId: event.reservation.externalId,
        error: processResult.error ?? "Unknown error",
      });
      Sentry.captureMessage(`PMS event processing failed`, {
        level: "warning",
        tags: { provider, hotelId, eventType: event.type },
        extra: {
          externalId: event.reservation.externalId,
          error: processResult.error,
        },
      });
    }
  }

  if (result.errors.length > 0) {
    result.success = result.eventsProcessed > 0;
  }

  // Log sync status to integration_configs for admin visibility
  await adminClient
    .from("integration_configs")
    .upsert(
      {
        hotel_id: hotelId,
        provider: "mews",
        last_sync_at: new Date().toISOString(),
        last_sync_status: result.success ? "success" : "partial_failure",
        last_sync_error:
          result.errors.length > 0
            ? JSON.stringify(result.errors.slice(0, 5))
            : null,
      },
      { onConflict: "hotel_id,provider" },
    )
    .then(({ error }) => {
      if (error) {
        console.error("[pms-webhook] Failed to update sync status:", error.message);
      }
    });

  return NextResponse.json(result, {
    status: result.success ? 200 : 207,
  });
}

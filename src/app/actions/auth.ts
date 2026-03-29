"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const verifyBookingSchema = z.object({
  confirmationNumber: z
    .string()
    .min(1, "Confirmation number is required")
    .max(50, "Confirmation number is too long")
    .trim(),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .max(100, "Last name is too long")
    .trim(),
});

const sendMagicLinkSchema = z.object({
  email: z.string().email("Invalid email address"),
  bookingId: z.string().uuid("Invalid booking ID"),
  hotelId: z.string().uuid("Invalid hotel ID"),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface VerifyBookingResult {
  success: boolean;
  error?: string;
  bookingId?: string;
  hotelId?: string;
}

interface SendMagicLinkResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// verifyBookingReference
// ---------------------------------------------------------------------------

export async function verifyBookingReference(
  confirmationNumber: string,
  lastName: string,
): Promise<VerifyBookingResult> {
  // 1. Validate input
  const parsed = verifyBookingSchema.safeParse({ confirmationNumber, lastName });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();

    // 2. Look up booking by confirmation_number + guest_last_name (case-insensitive)
    const { data: booking, error: queryError } = await supabase
      .from("bookings")
      .select("id, hotel_id, status")
      .ilike("confirmation_number", parsed.data.confirmationNumber)
      .ilike("guest_last_name", parsed.data.lastName)
      .in("status", ["confirmed", "checked_in"])
      .maybeSingle();

    if (queryError) {
      console.error("[verifyBookingReference] DB error:", queryError.message);
      return { success: false, error: "Unable to verify booking. Please try again." };
    }

    if (!booking) {
      return {
        success: false,
        error: "No active booking found with that confirmation number. Please check your details and try again.",
      };
    }

    // 3. Return booking info on success
    return {
      success: true,
      bookingId: booking.id,
      hotelId: booking.hotel_id,
    };
  } catch {
    console.error("[verifyBookingReference] Unexpected error");
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// sendGuestMagicLink
// ---------------------------------------------------------------------------

export async function sendGuestMagicLink(
  email: string,
  bookingId: string,
  hotelId: string,
): Promise<SendMagicLinkResult> {
  // 1. Validate input
  const parsed = sendMagicLinkSchema.safeParse({ email, bookingId, hotelId });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();

    // 2. Send magic link OTP with booking metadata
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        data: {
          booking_id: parsed.data.bookingId,
          hotel_id: parsed.data.hotelId,
        },
      },
    });

    if (error) {
      console.error("[sendGuestMagicLink] Auth error:", error.message);
      return { success: false, error: "Unable to send magic link. Please try again." };
    }

    return { success: true };
  } catch {
    console.error("[sendGuestMagicLink] Unexpected error");
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveStaffContext } from "@/lib/auth-context";
import { generateQRCodeDataURL } from "@/lib/qr";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const generateGuestEntryQRSchema = z.object({
  hotelId: z.string().uuid("Invalid hotel ID"),
  roomNumber: z.string().min(1, "Room number is required").max(20, "Room number is too long").trim(),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface GenerateGuestEntryQRResult {
  success: boolean;
  qrDataUrl?: string;
  entryUrl?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// generateGuestEntryQR
// ---------------------------------------------------------------------------

/**
 * Generates a QR code for guest room entry/registration.
 * Only staff, manager, or admin roles may generate QR codes.
 *
 * @param hotelId - UUID of the hotel
 * @param roomNumber - Room number (e.g., "101")
 * @returns QR code data URL and the destination URL
 */
export async function generateGuestEntryQR(
  hotelId: string,
  roomNumber: string,
): Promise<GenerateGuestEntryQRResult> {
  // 1. Validate inputs
  const parsed = generateGuestEntryQRSchema.safeParse({ hotelId, roomNumber });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate + authorize via DB (not JWT — avoids stale role after demotion)
    const ctx = await resolveStaffContext(supabase);
    if ("error" in ctx) {
      return { success: false, error: "Insufficient permissions to generate QR codes" };
    }

    // 4. Build the guest entry URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const entryUrl = `${appUrl}/auth/guest/verify?hotel=${encodeURIComponent(parsed.data.hotelId)}&room=${encodeURIComponent(parsed.data.roomNumber)}`;

    // 5. Generate QR code
    const qrDataUrl = await generateQRCodeDataURL(entryUrl, { size: 300 });

    return { success: true, qrDataUrl, entryUrl };
  } catch {
    return { success: false, error: "Failed to generate QR code. Please try again." };
  }
}

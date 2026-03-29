"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
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

    // 2. Authenticate
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Authorize — only staff/manager/admin can generate QR codes
    const session = await supabase.auth.getSession();
    const jwt = session.data.session?.access_token;
    let userRole = "guest";

    if (jwt) {
      try {
        const payload = JSON.parse(
          Buffer.from(jwt.split(".")[1], "base64url").toString(),
        ) as Record<string, unknown>;
        userRole = typeof payload.app_role === "string" ? payload.app_role : "guest";
      } catch {
        // JWT decode failure defaults to guest
      }
    }

    const authorizedRoles = ["staff", "front_desk", "manager", "super_admin"];
    if (!authorizedRoles.includes(userRole)) {
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

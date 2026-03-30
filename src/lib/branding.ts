import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Branding data for the guest portal. Mirrors HotelBranding from
 * src/app/actions/branding.ts but is fetched without manager auth —
 * hotel_branding SELECT is publicly accessible per RLS policy.
 */
export interface GuestBranding {
  primaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  fontHeading: string | null;
  fontBody: string | null;
  customCss: string | null;
  logoUrl: string | null;
  logoLightUrl: string | null;
  faviconUrl: string | null;
  welcomeMessage: string | null;
}

// ---------------------------------------------------------------------------
// getHotelBranding
// ---------------------------------------------------------------------------

/**
 * Fetch branding for a hotel by ID. No manager auth required — hotel_branding
 * rows for active hotels are readable by any authenticated user per RLS.
 * Used by the guest portal to apply hotel-specific theming at render time.
 *
 * Returns null when the hotel has no branding row configured.
 */
export async function getHotelBranding(hotelId: string): Promise<GuestBranding | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("hotel_branding")
    .select(
      "primary_color, accent_color, background_color, font_heading, font_body, custom_css, logo_url, logo_light_url, favicon_url, welcome_message",
    )
    .eq("hotel_id", hotelId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    primaryColor: data.primary_color,
    accentColor: data.accent_color,
    backgroundColor: data.background_color,
    fontHeading: data.font_heading,
    fontBody: data.font_body,
    customCss: data.custom_css,
    logoUrl: data.logo_url,
    logoLightUrl: data.logo_light_url,
    faviconUrl: data.favicon_url,
    welcomeMessage: data.welcome_message,
  };
}

// ---------------------------------------------------------------------------
// resolveGuestHotelId
// ---------------------------------------------------------------------------

/**
 * Resolve the hotel ID for the currently authenticated guest by looking up
 * their active stay. Returns null if the user is unauthenticated or has no
 * active stay. Called from server components / layouts in the guest portal.
 */
export async function resolveGuestHotelId(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data: stay, error: stayError } = await supabase
    .from("stays")
    .select("hotel_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (stayError || !stay) return null;

  return stay.hotel_id as string;
}

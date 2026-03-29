"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveStaffContext, isManagerRole } from "@/lib/auth-context";
import { REQUEST_CATEGORIES, REQUEST_PRIORITIES } from "@/constants/app";
import type { ActionResult } from "@/app/actions/requests";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HotelBranding {
  logoUrl: string | null;
  logoLightUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  backgroundColor: string | null;
  fontHeading: string | null;
  fontBody: string | null;
  customCss: string | null;
  welcomeMessage: string | null;
}

export interface HotelSettings {
  id: string;
  name: string;
  slug: string;
  type: string | null;
  location: string | null;
  address: string | null;
  description: string | null;
  amenities: string[];
  imageUrl: string | null;
  settings: Record<string, unknown>;
}

export interface SlaConfig {
  id: string;
  category: string;
  priority: string;
  targetMinutes: number;
}

export interface ServiceOption {
  id: string;
  serviceType: string;
  name: string;
  description: string | null;
  price: number | null;
  etaMinutes: number | null;
  sortOrder: number;
  isActive: boolean;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Strip HTML tags from a string — prevents XSS if customCss is rendered as HTML elsewhere
function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, "");
}

const hexColorSchema = z
  .string()
  .regex(HEX_COLOR_REGEX, "Color must be a valid hex code (#xxx or #xxxxxx)")
  .nullable()
  .optional();

const updateBrandingSchema = z.object({
  logoUrl: z.string().url("Invalid logo URL").nullable().optional(),
  logoLightUrl: z.string().url("Invalid light logo URL").nullable().optional(),
  faviconUrl: z.string().url("Invalid favicon URL").nullable().optional(),
  primaryColor: hexColorSchema,
  accentColor: hexColorSchema,
  backgroundColor: hexColorSchema,
  fontHeading: z.string().max(100).nullable().optional(),
  fontBody: z.string().max(100).nullable().optional(),
  customCss: z
    .string()
    .max(10000, "Custom CSS must be 10,000 characters or fewer")
    .nullable()
    .optional(),
  welcomeMessage: z.string().max(2000).nullable().optional(),
});

const updateHotelSettingsSchema = z.object({
  name: z.string().min(1, "Hotel name is required").max(255).optional(),
  type: z.string().max(100).nullable().optional(),
  location: z.string().max(500).nullable().optional(),
  address: z.string().max(500).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  amenities: z.array(z.string().max(100)).max(100).optional(),
});

const updateSlaConfigSchema = z.object({
  category: z.enum(REQUEST_CATEGORIES, {
    message: "Invalid request category",
  }),
  priority: z.enum(REQUEST_PRIORITIES, {
    message: "Invalid request priority",
  }),
  targetMinutes: z
    .number()
    .int()
    .min(1, "Target minutes must be at least 1")
    .max(10080, "Target minutes cannot exceed 7 days"),
});

const serviceOptionIdSchema = z.object({
  id: z.string().uuid("Invalid service option ID"),
});

const updateServiceOptionSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().min(0).max(99999.99).nullable().optional(),
  etaMinutes: z.number().int().min(1).max(10080).nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  isActive: z.boolean().optional(),
});

const createServiceOptionSchema = z.object({
  serviceType: z.string().min(1, "Service type is required").max(100),
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).nullable().optional(),
  price: z.number().min(0).max(99999.99).nullable().optional(),
  etaMinutes: z.number().int().min(1).max(10080).nullable().optional(),
});

// ---------------------------------------------------------------------------
// Auth helper — resolves staff context and verifies manager role
// Returns { hotelId, error } — hotelId is only present when error is null
// ---------------------------------------------------------------------------

async function resolveManagerContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<{ hotelId: string; error: null } | { hotelId: null; error: string }> {
  const ctx = await resolveStaffContext(supabase);
  if (ctx.error || !ctx.user) return { hotelId: null, error: ctx.error ?? "Unauthorized" };

  const manager = await isManagerRole(supabase, ctx.user.id);
  if (!manager) return { hotelId: null, error: "Unauthorized" };

  return { hotelId: ctx.assignment!.hotel_id, error: null };
}

// ---------------------------------------------------------------------------
// getBranding
// ---------------------------------------------------------------------------

export async function getBranding(): Promise<ActionResult<HotelBranding>> {
  try {
    const supabase = await createClient();
    const { hotelId, error } = await resolveManagerContext(supabase);
    if (error) return { success: false, error };

    const { data, error: queryError } = await supabase
      .from("hotel_branding")
      .select(
        "logo_url, logo_light_url, favicon_url, primary_color, accent_color, background_color, font_heading, font_body, custom_css, welcome_message",
      )
      .eq("hotel_id", hotelId)
      .maybeSingle();

    if (queryError) {
      return { success: false, error: "Failed to retrieve branding configuration." };
    }

    // Return nulls for every field when no branding row exists yet
    const branding: HotelBranding = data
      ? {
          logoUrl: data.logo_url,
          logoLightUrl: data.logo_light_url,
          faviconUrl: data.favicon_url,
          primaryColor: data.primary_color,
          accentColor: data.accent_color,
          backgroundColor: data.background_color,
          fontHeading: data.font_heading,
          fontBody: data.font_body,
          customCss: data.custom_css,
          welcomeMessage: data.welcome_message,
        }
      : {
          logoUrl: null,
          logoLightUrl: null,
          faviconUrl: null,
          primaryColor: null,
          accentColor: null,
          backgroundColor: null,
          fontHeading: null,
          fontBody: null,
          customCss: null,
          welcomeMessage: null,
        };

    return { success: true, data: branding };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// updateBranding
// ---------------------------------------------------------------------------

export async function updateBranding(
  input: Partial<HotelBranding>,
): Promise<ActionResult<HotelBranding>> {
  const parsed = updateBrandingSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();
    const { hotelId, error } = await resolveManagerContext(supabase);
    if (error) return { success: false, error };

    // Sanitize customCss — strip any HTML tags to prevent XSS
    const sanitizedCss =
      parsed.data.customCss != null
        ? stripHtmlTags(parsed.data.customCss)
        : parsed.data.customCss;

    const { data, error: upsertError } = await supabase
      .from("hotel_branding")
      .upsert(
        {
          hotel_id: hotelId,
          logo_url: parsed.data.logoUrl,
          logo_light_url: parsed.data.logoLightUrl,
          favicon_url: parsed.data.faviconUrl,
          primary_color: parsed.data.primaryColor,
          accent_color: parsed.data.accentColor,
          background_color: parsed.data.backgroundColor,
          font_heading: parsed.data.fontHeading,
          font_body: parsed.data.fontBody,
          custom_css: sanitizedCss,
          welcome_message: parsed.data.welcomeMessage,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "hotel_id", ignoreDuplicates: false },
      )
      .select(
        "logo_url, logo_light_url, favicon_url, primary_color, accent_color, background_color, font_heading, font_body, custom_css, welcome_message",
      )
      .single();

    if (upsertError) {
      return { success: false, error: "Failed to save branding configuration." };
    }

    return {
      success: true,
      data: {
        logoUrl: data.logo_url,
        logoLightUrl: data.logo_light_url,
        faviconUrl: data.favicon_url,
        primaryColor: data.primary_color,
        accentColor: data.accent_color,
        backgroundColor: data.background_color,
        fontHeading: data.font_heading,
        fontBody: data.font_body,
        customCss: data.custom_css,
        welcomeMessage: data.welcome_message,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// getHotelSettings
// ---------------------------------------------------------------------------

export async function getHotelSettings(): Promise<ActionResult<HotelSettings>> {
  try {
    const supabase = await createClient();
    const { hotelId, error } = await resolveManagerContext(supabase);
    if (error) return { success: false, error };

    const { data, error: queryError } = await supabase
      .from("hotels")
      .select(
        "id, name, slug, type, location, address, description, amenities, image_url, settings",
      )
      .eq("id", hotelId)
      .single();

    if (queryError) {
      return { success: false, error: "Failed to retrieve hotel settings." };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        type: data.type,
        location: data.location,
        address: data.address,
        description: data.description,
        amenities: data.amenities ?? [],
        imageUrl: data.image_url,
        settings: (data.settings as Record<string, unknown>) ?? {},
      },
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// updateHotelSettings
// ---------------------------------------------------------------------------

export async function updateHotelSettings(
  input: z.input<typeof updateHotelSettingsSchema>,
): Promise<ActionResult<HotelSettings>> {
  const parsed = updateHotelSettingsSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();
    const { hotelId, error } = await resolveManagerContext(supabase);
    if (error) return { success: false, error };

    // Build update payload with only provided fields
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name;
    if (parsed.data.type !== undefined) updatePayload.type = parsed.data.type;
    if (parsed.data.location !== undefined) updatePayload.location = parsed.data.location;
    if (parsed.data.address !== undefined) updatePayload.address = parsed.data.address;
    if (parsed.data.description !== undefined) updatePayload.description = parsed.data.description;
    if (parsed.data.amenities !== undefined) updatePayload.amenities = parsed.data.amenities;

    const { data, error: updateError } = await supabase
      .from("hotels")
      .update(updatePayload)
      .eq("id", hotelId)
      .select(
        "id, name, slug, type, location, address, description, amenities, image_url, settings",
      )
      .single();

    if (updateError) {
      return { success: false, error: "Failed to update hotel settings." };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        slug: data.slug,
        type: data.type,
        location: data.location,
        address: data.address,
        description: data.description,
        amenities: data.amenities ?? [],
        imageUrl: data.image_url,
        settings: (data.settings as Record<string, unknown>) ?? {},
      },
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// getSlaConfigs
// ---------------------------------------------------------------------------

export async function getSlaConfigs(): Promise<ActionResult<SlaConfig[]>> {
  try {
    const supabase = await createClient();
    const { hotelId, error } = await resolveManagerContext(supabase);
    if (error) return { success: false, error };

    const { data, error: queryError } = await supabase
      .from("sla_configs")
      .select("id, category, priority, target_minutes")
      .eq("hotel_id", hotelId)
      .order("category")
      .order("priority");

    if (queryError) {
      return { success: false, error: "Failed to retrieve SLA configurations." };
    }

    return {
      success: true,
      data: (data ?? []).map((row) => ({
        id: row.id,
        category: row.category,
        priority: row.priority,
        targetMinutes: row.target_minutes,
      })),
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// updateSlaConfig
// ---------------------------------------------------------------------------

export async function updateSlaConfig(
  input: z.input<typeof updateSlaConfigSchema>,
): Promise<ActionResult<SlaConfig>> {
  const parsed = updateSlaConfigSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();
    const { hotelId, error } = await resolveManagerContext(supabase);
    if (error) return { success: false, error };

    const { data, error: upsertError } = await supabase
      .from("sla_configs")
      .upsert(
        {
          hotel_id: hotelId,
          category: parsed.data.category,
          priority: parsed.data.priority,
          target_minutes: parsed.data.targetMinutes,
        },
        { onConflict: "hotel_id,category,priority", ignoreDuplicates: false },
      )
      .select("id, category, priority, target_minutes")
      .single();

    if (upsertError) {
      return { success: false, error: "Failed to save SLA configuration." };
    }

    return {
      success: true,
      data: {
        id: data.id,
        category: data.category,
        priority: data.priority,
        targetMinutes: data.target_minutes,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// getServiceOptions
// ---------------------------------------------------------------------------

export async function getServiceOptions(): Promise<ActionResult<ServiceOption[]>> {
  try {
    const supabase = await createClient();
    const { hotelId, error } = await resolveManagerContext(supabase);
    if (error) return { success: false, error };

    const { data, error: queryError } = await supabase
      .from("service_options")
      .select(
        "id, service_type, name, description, price, eta_minutes, sort_order, is_active",
      )
      .eq("hotel_id", hotelId)
      .order("service_type")
      .order("sort_order");

    if (queryError) {
      return { success: false, error: "Failed to retrieve service options." };
    }

    return {
      success: true,
      data: (data ?? []).map((row) => ({
        id: row.id,
        serviceType: row.service_type,
        name: row.name,
        description: row.description,
        price: row.price,
        etaMinutes: row.eta_minutes,
        sortOrder: row.sort_order,
        isActive: row.is_active,
      })),
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// updateServiceOption
// ---------------------------------------------------------------------------

export async function updateServiceOption(
  id: string,
  input: z.input<typeof updateServiceOptionSchema>,
): Promise<ActionResult<ServiceOption>> {
  const idParsed = serviceOptionIdSchema.safeParse({ id });
  if (!idParsed.success) {
    return { success: false, error: "Invalid service option ID" };
  }

  const parsed = updateServiceOptionSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();
    const { hotelId, error } = await resolveManagerContext(supabase);
    if (error) return { success: false, error };

    // Build update payload with only provided fields
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.name !== undefined) updatePayload.name = parsed.data.name;
    if (parsed.data.description !== undefined) updatePayload.description = parsed.data.description;
    if (parsed.data.price !== undefined) updatePayload.price = parsed.data.price;
    if (parsed.data.etaMinutes !== undefined) updatePayload.eta_minutes = parsed.data.etaMinutes;
    if (parsed.data.sortOrder !== undefined) updatePayload.sort_order = parsed.data.sortOrder;
    if (parsed.data.isActive !== undefined) updatePayload.is_active = parsed.data.isActive;

    const { data, error: updateError } = await supabase
      .from("service_options")
      .update(updatePayload)
      // Filter by both id and hotel_id to enforce tenant isolation
      .eq("id", idParsed.data.id)
      .eq("hotel_id", hotelId)
      .select(
        "id, service_type, name, description, price, eta_minutes, sort_order, is_active",
      )
      .single();

    if (updateError) {
      return { success: false, error: "Failed to update service option." };
    }

    return {
      success: true,
      data: {
        id: data.id,
        serviceType: data.service_type,
        name: data.name,
        description: data.description,
        price: data.price,
        etaMinutes: data.eta_minutes,
        sortOrder: data.sort_order,
        isActive: data.is_active,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// createServiceOption
// ---------------------------------------------------------------------------

export async function createServiceOption(
  input: z.input<typeof createServiceOptionSchema>,
): Promise<ActionResult<ServiceOption>> {
  const parsed = createServiceOptionSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();
    const { hotelId, error } = await resolveManagerContext(supabase);
    if (error) return { success: false, error };

    // Derive sort_order as max existing + 1 for this service type
    const { data: existing } = await supabase
      .from("service_options")
      .select("sort_order")
      .eq("hotel_id", hotelId)
      .eq("service_type", parsed.data.serviceType)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextSortOrder = existing ? existing.sort_order + 1 : 0;

    const { data, error: insertError } = await supabase
      .from("service_options")
      .insert({
        hotel_id: hotelId,
        service_type: parsed.data.serviceType,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        price: parsed.data.price ?? null,
        eta_minutes: parsed.data.etaMinutes ?? null,
        sort_order: nextSortOrder,
        is_active: true,
      })
      .select(
        "id, service_type, name, description, price, eta_minutes, sort_order, is_active",
      )
      .single();

    if (insertError) {
      return { success: false, error: "Failed to create service option." };
    }

    return {
      success: true,
      data: {
        id: data.id,
        serviceType: data.service_type,
        name: data.name,
        description: data.description,
        price: data.price,
        etaMinutes: data.eta_minutes,
        sortOrder: data.sort_order,
        isActive: data.is_active,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

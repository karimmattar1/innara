"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { resolveManagerContext } from "@/lib/auth-context";
import type { ActionResult } from "@/app/actions/requests";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ServiceHours {
  dayOfWeek: number; // 0=Sunday, 6=Saturday
  openTime: string; // "HH:mm" format
  closeTime: string; // "HH:mm" format
  isClosed: boolean;
}

export interface ServiceSchedule {
  serviceType: string;
  hours: ServiceHours[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SERVICE_TYPES = [
  "housekeeping",
  "room_service",
  "concierge",
  "spa",
  "valet",
  "maintenance",
] as const;

const DEFAULT_OPEN_TIME = "00:00";
const DEFAULT_CLOSE_TIME = "23:59";
const DAYS_IN_WEEK = 7;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const serviceHoursSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    openTime: z.string().regex(TIME_REGEX, "Time must be in HH:mm format"),
    closeTime: z.string().regex(TIME_REGEX, "Time must be in HH:mm format"),
    isClosed: z.boolean(),
  })
  .refine(
    (val) => {
      // When isClosed is true, time validation is irrelevant
      if (val.isClosed) return true;
      return val.openTime < val.closeTime;
    },
    { message: "openTime must be earlier than closeTime", path: ["openTime"] },
  );

const serviceScheduleInputSchema = z.object({
  serviceType: z
    .string()
    .min(1, "Service type is required")
    .max(100, "Service type must be 100 characters or fewer"),
  hours: z
    .array(serviceHoursSchema)
    .length(DAYS_IN_WEEK, "Hours array must contain exactly 7 entries (one per day)"),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildDefaultSchedules(): ServiceSchedule[] {
  return SERVICE_TYPES.map((serviceType) => ({
    serviceType,
    hours: Array.from({ length: DAYS_IN_WEEK }, (_, dayOfWeek) => ({
      dayOfWeek,
      openTime: DEFAULT_OPEN_TIME,
      closeTime: DEFAULT_CLOSE_TIME,
      isClosed: false,
    })),
  }));
}

// ---------------------------------------------------------------------------
// getServiceSchedules
// ---------------------------------------------------------------------------

export async function getServiceSchedules(): Promise<ActionResult<ServiceSchedule[]>> {
  try {
    const supabase = await createClient();
    const ctx = await resolveManagerContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };
    const { hotelId } = ctx;

    const { data, error: queryError } = await supabase
      .from("hotels")
      .select("settings")
      .eq("id", hotelId)
      .single();

    if (queryError) {
      return { success: false, error: "Failed to retrieve service schedules." };
    }

    const settings = (data?.settings as Record<string, unknown>) ?? {};
    const stored = settings.service_hours as ServiceSchedule[] | undefined;

    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      return { success: true, data: buildDefaultSchedules() };
    }

    return { success: true, data: stored };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

// ---------------------------------------------------------------------------
// updateServiceSchedule
// ---------------------------------------------------------------------------

export async function updateServiceSchedule(
  serviceType: string,
  hours: ServiceHours[],
): Promise<ActionResult<void>> {
  const parsed = serviceScheduleInputSchema.safeParse({ serviceType, hours });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();
    const ctx = await resolveManagerContext(supabase);
    if ("error" in ctx) return { success: false, error: ctx.error };
    const { hotelId } = ctx;

    // Read current settings to perform a safe merge
    const { data: hotelData, error: readError } = await supabase
      .from("hotels")
      .select("settings")
      .eq("id", hotelId)
      .single();

    if (readError) {
      return { success: false, error: "Failed to read hotel settings." };
    }

    const currentSettings = (hotelData?.settings as Record<string, unknown>) ?? {};
    const currentServiceHours = (currentSettings.service_hours as ServiceSchedule[]) ?? [];

    // Replace or add the schedule for this service type
    const existingIndex = currentServiceHours.findIndex(
      (s) => s.serviceType === parsed.data.serviceType,
    );

    const updatedServiceHours: ServiceSchedule[] =
      existingIndex !== -1
        ? currentServiceHours.map((schedule, index) =>
            index === existingIndex
              ? { serviceType: parsed.data.serviceType, hours: parsed.data.hours }
              : schedule,
          )
        : [
            ...currentServiceHours,
            { serviceType: parsed.data.serviceType, hours: parsed.data.hours },
          ];

    const { error: updateError } = await supabase
      .from("hotels")
      .update({
        settings: {
          ...currentSettings,
          service_hours: updatedServiceHours,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", hotelId);

    if (updateError) {
      return { success: false, error: "Failed to save service schedule." };
    }

    return { success: true };
  } catch {
    return { success: false, error: "Something went wrong." };
  }
}

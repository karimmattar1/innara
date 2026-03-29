"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { DEPARTMENTS } from "@/constants/app";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const shiftAssignmentIdSchema = z.object({
  shiftAssignmentId: z.string().uuid("Invalid shift assignment ID"),
});

const getMyShiftsFiltersSchema = z.object({
  dateFrom: z.string().date("Invalid dateFrom — expected ISO date (YYYY-MM-DD)").optional(),
  dateTo: z.string().date("Invalid dateTo — expected ISO date (YYYY-MM-DD)").optional(),
  status: z
    .array(z.enum(["scheduled", "active", "completed", "absent"]))
    .max(4)
    .optional(),
});

const getShiftScheduleSchema = z.object({
  dateFrom: z.string().date("Invalid dateFrom — expected ISO date (YYYY-MM-DD)"),
  dateTo: z.string().date("Invalid dateTo — expected ISO date (YYYY-MM-DD)"),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

export interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export type ShiftStatus = "scheduled" | "active" | "completed" | "absent";
export type Department = (typeof DEPARTMENTS)[number];

export interface ShiftData {
  id: string;
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ShiftStatus;
  department: Department | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  notes: string | null;
}

export interface ShiftAssignmentData {
  id: string;
  shiftId: string;
  staffId: string;
  status: ShiftStatus;
  checkInAt: string | null;
  checkOutAt: string | null;
}

export interface ShiftStaffMember {
  id: string;
  name: string;
  department: Department | null;
  status: ShiftStatus;
}

export interface ScheduleShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  staff: ShiftStaffMember[];
}

export interface ScheduleDay {
  date: string;
  shifts: ScheduleShift[];
}

export interface ActiveStaffMember {
  staffId: string;
  name: string;
  department: Department | null;
  checkInAt: string;
  shiftName: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Returns today's date in YYYY-MM-DD format (UTC). */
function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Resolves the hotel_id for the authenticated user from staff_assignments.
 * Returns null when the user has no active staff assignment (not a staff member).
 */
async function resolveHotelId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("staff_assignments")
    .select("hotel_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data.hotel_id as string;
}

// ---------------------------------------------------------------------------
// getMyShifts
// ---------------------------------------------------------------------------

export async function getMyShifts(
  filters?: z.input<typeof getMyShiftsFiltersSchema>,
): Promise<ActionResult<ShiftData[]>> {
  // 1. Validate input
  const parsed = getMyShiftsFiltersSchema.safeParse(filters ?? {});
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid filters";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Resolve hotel_id (multi-tenant isolation)
    const hotelId = await resolveHotelId(supabase, user.id);
    if (!hotelId) {
      return { success: false, error: "No active staff assignment found." };
    }

    // 4. Build query — shift_assignments joined with shifts, filtered by hotel
    let query = supabase
      .from("shift_assignments")
      .select(
        `
        id,
        staff_id,
        department,
        status,
        check_in_at,
        check_out_at,
        shifts!inner (
          id,
          hotel_id,
          name,
          date,
          start_time,
          end_time,
          notes
        )
        `,
      )
      .eq("staff_id", user.id)
      .eq("shifts.hotel_id", hotelId)
      .order("date", { ascending: true, foreignTable: "shifts" })
      .order("start_time", { ascending: true, foreignTable: "shifts" });

    if (parsed.data.dateFrom) {
      query = query.gte("shifts.date", parsed.data.dateFrom);
    }
    if (parsed.data.dateTo) {
      query = query.lte("shifts.date", parsed.data.dateTo);
    }
    if (parsed.data.status && parsed.data.status.length > 0) {
      query = query.in("status", parsed.data.status);
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      return { success: false, error: "Unable to retrieve shifts. Please try again." };
    }

    const shifts: ShiftData[] = (data ?? []).map((row) => {
      const shift = (row.shifts as unknown) as {
        id: string;
        name: string;
        date: string;
        start_time: string;
        end_time: string;
        notes: string | null;
      };
      return {
        id: shift.id,
        name: shift.name,
        date: shift.date,
        startTime: shift.start_time,
        endTime: shift.end_time,
        status: row.status as ShiftStatus,
        department: (row.department as Department | null) ?? null,
        checkInAt: row.check_in_at as string | null,
        checkOutAt: row.check_out_at as string | null,
        notes: shift.notes,
      };
    });

    return { success: true, data: shifts };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getTodayShift
// ---------------------------------------------------------------------------

export async function getTodayShift(): Promise<ActionResult<ShiftData | null>> {
  const today = todayUTC();
  const result = await getMyShifts({ dateFrom: today, dateTo: today });
  if (!result.success) {
    return { success: false, error: result.error };
  }
  const shifts = result.data ?? [];
  return { success: true, data: shifts[0] ?? null };
}

// ---------------------------------------------------------------------------
// checkIn
// ---------------------------------------------------------------------------

export async function checkIn(
  shiftAssignmentId: string,
): Promise<ActionResult<ShiftAssignmentData>> {
  // 1. Validate input
  const parsed = shiftAssignmentIdSchema.safeParse({ shiftAssignmentId });
  if (!parsed.success) {
    return { success: false, error: "Invalid shift assignment ID" };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Fetch the assignment — must belong to this staff member
    const { data: assignment, error: fetchError } = await supabase
      .from("shift_assignments")
      .select(
        `
        id,
        staff_id,
        status,
        check_in_at,
        check_out_at,
        shift_id,
        shifts!inner (
          id,
          hotel_id,
          date
        )
        `,
      )
      .eq("id", parsed.data.shiftAssignmentId)
      .eq("staff_id", user.id)
      .maybeSingle();

    if (fetchError || !assignment) {
      return { success: false, error: "Shift assignment not found." };
    }

    // 4. Status guard — must be 'scheduled' to check in
    if (assignment.status !== "scheduled") {
      if (assignment.status === "active") {
        return { success: false, error: "You are already checked in to this shift." };
      }
      return {
        success: false,
        error: "Cannot check in: shift is not in scheduled status.",
      };
    }

    // 5. Date guard — shift must be today (UTC)
    const shift = (assignment.shifts as unknown) as { id: string; hotel_id: string; date: string };
    if (shift.date !== todayUTC()) {
      return {
        success: false,
        error: "You can only check in on the day of your shift.",
      };
    }

    // 6. Verify hotel isolation via staff_assignments
    const hotelId = await resolveHotelId(supabase, user.id);
    if (!hotelId || hotelId !== shift.hotel_id) {
      return { success: false, error: "Unauthorized" };
    }

    // 7. Update — status = 'active', check_in_at = now()
    const { data: updated, error: updateError } = await supabase
      .from("shift_assignments")
      .update({
        status: "active",
        check_in_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.shiftAssignmentId)
      .eq("staff_id", user.id)
      .select("id, shift_id, staff_id, status, check_in_at, check_out_at")
      .single();

    if (updateError || !updated) {
      return { success: false, error: "Failed to check in. Please try again." };
    }

    return {
      success: true,
      data: {
        id: updated.id as string,
        shiftId: updated.shift_id as string,
        staffId: updated.staff_id as string,
        status: updated.status as ShiftStatus,
        checkInAt: updated.check_in_at as string | null,
        checkOutAt: updated.check_out_at as string | null,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// checkOut
// ---------------------------------------------------------------------------

export async function checkOut(
  shiftAssignmentId: string,
): Promise<ActionResult<ShiftAssignmentData>> {
  // 1. Validate input
  const parsed = shiftAssignmentIdSchema.safeParse({ shiftAssignmentId });
  if (!parsed.success) {
    return { success: false, error: "Invalid shift assignment ID" };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Fetch the assignment — must belong to this staff member
    const { data: assignment, error: fetchError } = await supabase
      .from("shift_assignments")
      .select("id, staff_id, status, shift_id")
      .eq("id", parsed.data.shiftAssignmentId)
      .eq("staff_id", user.id)
      .maybeSingle();

    if (fetchError || !assignment) {
      return { success: false, error: "Shift assignment not found." };
    }

    // 4. Status guard — must be 'active' to check out
    if (assignment.status !== "active") {
      if (assignment.status === "completed") {
        return { success: false, error: "You have already checked out of this shift." };
      }
      return {
        success: false,
        error: "Cannot check out: you are not currently checked in.",
      };
    }

    // 5. Update — status = 'completed', check_out_at = now()
    const { data: updated, error: updateError } = await supabase
      .from("shift_assignments")
      .update({
        status: "completed",
        check_out_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.shiftAssignmentId)
      .eq("staff_id", user.id)
      .select("id, shift_id, staff_id, status, check_in_at, check_out_at")
      .single();

    if (updateError || !updated) {
      return { success: false, error: "Failed to check out. Please try again." };
    }

    return {
      success: true,
      data: {
        id: updated.id as string,
        shiftId: updated.shift_id as string,
        staffId: updated.staff_id as string,
        status: updated.status as ShiftStatus,
        checkInAt: updated.check_in_at as string | null,
        checkOutAt: updated.check_out_at as string | null,
      },
    };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getShiftSchedule
// ---------------------------------------------------------------------------

export async function getShiftSchedule(
  dateFrom: string,
  dateTo: string,
): Promise<ActionResult<ScheduleDay[]>> {
  // 1. Validate input
  const parsed = getShiftScheduleSchema.safeParse({ dateFrom, dateTo });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid date range";
    return { success: false, error: firstError };
  }

  try {
    const supabase = await createClient();

    // 2. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 3. Resolve hotel_id (multi-tenant isolation)
    const hotelId = await resolveHotelId(supabase, user.id);
    if (!hotelId) {
      return { success: false, error: "No active staff assignment found." };
    }

    // 4. Query shifts for the hotel within the date range
    const { data: shifts, error: shiftsError } = await supabase
      .from("shifts")
      .select("id, name, date, start_time, end_time")
      .eq("hotel_id", hotelId)
      .gte("date", parsed.data.dateFrom)
      .lte("date", parsed.data.dateTo)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true });

    if (shiftsError) {
      return { success: false, error: "Unable to retrieve schedule. Please try again." };
    }

    if (!shifts || shifts.length === 0) {
      return { success: true, data: [] };
    }

    const shiftIds = shifts.map((s) => s.id as string);

    // 5. Query assignments with staff profiles for these shifts
    const { data: assignments, error: assignmentsError } = await supabase
      .from("shift_assignments")
      .select(
        `
        id,
        shift_id,
        staff_id,
        department,
        status,
        profiles!inner (
          id,
          full_name
        )
        `,
      )
      .in("shift_id", shiftIds);

    if (assignmentsError) {
      return { success: false, error: "Unable to retrieve schedule. Please try again." };
    }

    // 6. Build a map: shiftId -> staff[]
    const staffByShift = new Map<string, ShiftStaffMember[]>();
    for (const row of assignments ?? []) {
      const shiftId = row.shift_id as string;
      const profile = (row.profiles as unknown) as { id: string; full_name: string | null };
      if (!staffByShift.has(shiftId)) {
        staffByShift.set(shiftId, []);
      }
      staffByShift.get(shiftId)!.push({
        id: row.staff_id as string,
        name: profile.full_name ?? "Unknown",
        department: (row.department as Department | null) ?? null,
        status: row.status as ShiftStatus,
      });
    }

    // 7. Group shifts by date
    const dayMap = new Map<string, ScheduleShift[]>();
    for (const shift of shifts) {
      const date = shift.date as string;
      if (!dayMap.has(date)) {
        dayMap.set(date, []);
      }
      dayMap.get(date)!.push({
        id: shift.id as string,
        name: shift.name as string,
        startTime: shift.start_time as string,
        endTime: shift.end_time as string,
        staff: staffByShift.get(shift.id as string) ?? [],
      });
    }

    const schedule: ScheduleDay[] = Array.from(dayMap.entries()).map(
      ([date, dayShifts]) => ({ date, shifts: dayShifts }),
    );

    return { success: true, data: schedule };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

// ---------------------------------------------------------------------------
// getActiveStaffOnShift
// ---------------------------------------------------------------------------

export async function getActiveStaffOnShift(): Promise<
  ActionResult<ActiveStaffMember[]>
> {
  try {
    const supabase = await createClient();

    // 1. Authenticate
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Resolve hotel_id (multi-tenant isolation)
    const hotelId = await resolveHotelId(supabase, user.id);
    if (!hotelId) {
      return { success: false, error: "No active staff assignment found." };
    }

    // 3. Query active assignments, joining shifts (for hotel scope + name) and profiles
    const { data, error: queryError } = await supabase
      .from("shift_assignments")
      .select(
        `
        staff_id,
        check_in_at,
        staff_assignments!inner (
          hotel_id,
          department
        ),
        shifts!inner (
          hotel_id,
          name
        ),
        profiles!inner (
          full_name
        )
        `,
      )
      .eq("status", "active")
      .eq("shifts.hotel_id", hotelId)
      .eq("staff_assignments.hotel_id", hotelId);

    if (queryError) {
      return { success: false, error: "Unable to retrieve active staff. Please try again." };
    }

    const activeStaff: ActiveStaffMember[] = (data ?? []).map((row) => {
      const profile = (row.profiles as unknown) as { full_name: string | null };
      const staffAssignment = (row.staff_assignments as unknown) as {
        hotel_id: string;
        department: string | null;
      };
      const shift = (row.shifts as unknown) as { hotel_id: string; name: string };
      return {
        staffId: row.staff_id as string,
        name: profile.full_name ?? "Unknown",
        department: (staffAssignment.department as Department | null) ?? null,
        checkInAt: row.check_in_at as string,
        shiftName: shift.name,
      };
    });

    return { success: true, data: activeStaff };
  } catch {
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

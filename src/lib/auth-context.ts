import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// ---------------------------------------------------------------------------
// Staff context — authenticate + resolve active staff assignment
// ---------------------------------------------------------------------------

export interface StaffContext {
  error: null;
  user: { id: string; email?: string };
  assignment: {
    id: string;
    user_id: string;
    hotel_id: string;
    department: string | null;
    is_active: boolean;
  };
}

export interface StaffContextError {
  error: string;
  user: { id: string; email?: string } | null;
  assignment: null;
}

export async function resolveStaffContext(
  supabase: SupabaseClient,
): Promise<StaffContext | StaffContextError> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized", user: null, assignment: null };
  }

  const { data: assignment, error: assignError } = await supabase
    .from("staff_assignments")
    .select("id, user_id, hotel_id, department, is_active")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (assignError || !assignment) {
    return { error: "Staff assignment not found.", user, assignment: null };
  }

  return { error: null, user, assignment };
}

// ---------------------------------------------------------------------------
// Hotel ID only — lightweight variant for actions that just need tenant scoping
// ---------------------------------------------------------------------------

export async function resolveHotelId(
  supabase: SupabaseClient,
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
// Manager role check — queries user_roles table directly (not JWT claims)
// ---------------------------------------------------------------------------

export async function isManagerRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;
  return data.role === "manager" || data.role === "super_admin";
}

// ---------------------------------------------------------------------------
// Admin context — authenticate + verify super_admin role (no hotel scope)
// ---------------------------------------------------------------------------

export interface AdminContext {
  userId: string;
  email: string;
}

export interface AdminContextError {
  error: string;
}

export async function resolveAdminContext(
  supabase: SupabaseClient,
): Promise<(AdminContext & { error?: undefined }) | AdminContextError> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized" };
  }

  const { data: roleRow, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .limit(1)
    .maybeSingle();

  if (roleError || !roleRow) {
    return { error: "Forbidden" };
  }

  return { userId: user.id, email: user.email ?? "" };
}

// ---------------------------------------------------------------------------
// Manager context — authenticate + verify manager role + return hotel scope
// ---------------------------------------------------------------------------

export interface ManagerContext {
  userId: string;
  hotelId: string;
}

export interface ManagerContextError {
  error: string;
}

export async function resolveManagerContext(
  supabase: SupabaseClient,
): Promise<(ManagerContext & { error?: undefined }) | ManagerContextError> {
  const ctx = await resolveStaffContext(supabase);
  if (ctx.error || !ctx.user || !ctx.assignment) {
    return { error: ctx.error ?? "Unauthorized" };
  }

  const managerCheck = await isManagerRole(supabase, ctx.user.id);
  if (!managerCheck) return { error: "Unauthorized" };

  return { userId: ctx.user.id, hotelId: ctx.assignment.hotel_id };
}

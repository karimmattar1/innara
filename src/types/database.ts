/**
 * Database types placeholder.
 * Will be auto-generated from Supabase schema using:
 * npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type UserRole = "guest" | "staff" | "manager" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  hotel_id: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

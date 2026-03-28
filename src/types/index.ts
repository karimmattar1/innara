export type { Database, Json } from "./database";
export * from "./domain";

// Convenience type aliases from generated Supabase types
export type UserRole = "guest" | "staff" | "front_desk" | "manager" | "super_admin";

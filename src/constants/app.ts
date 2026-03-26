export const APP_NAME = "Innara";
export const APP_DESCRIPTION =
  "AI-Powered Hospitality Platform";

export const ROLES = {
  GUEST: "guest",
  STAFF: "staff",
  MANAGER: "manager",
  ADMIN: "admin",
} as const;

export const PORTAL_ROUTES = {
  guest: "/guest",
  staff: "/staff",
  manager: "/manager",
  admin: "/admin",
} as const;

export const DESIGN_TOKENS = {
  NAVY: "#1a1d3a",
  NAVY_LIGHT: "#252850",
  NAVY_DARK: "#12142a",
  BRONZE: "#9B7340",
  BRONZE_LIGHT: "#b8924f",
  BRONZE_DARK: "#7d5c33",
  GOLD: "#C4A265",
} as const;

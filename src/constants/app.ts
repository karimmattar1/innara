// ============================================
// INNARA APP CONSTANTS
// Single source of truth for app-wide configuration
// ============================================

export const APP_NAME = "Innara";
export const APP_DESCRIPTION =
  "AI-Powered Hospitality Platform";

export const ROLES = {
  GUEST: "guest",
  STAFF: "staff",
  FRONT_DESK: "front_desk",
  MANAGER: "manager",
  SUPER_ADMIN: "super_admin",
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

// ============================================
// REQUEST CONSTANTS
// ============================================

export const REQUEST_CATEGORIES = [
  "housekeeping",
  "maintenance",
  "room_service",
  "concierge",
  "valet",
  "spa",
  "other",
] as const;

export type RequestCategory = (typeof REQUEST_CATEGORIES)[number];

export const REQUEST_STATUSES = [
  "new",
  "pending",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const REQUEST_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

// ============================================
// DEPARTMENT CONSTANTS
// ============================================

export const DEPARTMENTS = [
  "housekeeping",
  "maintenance",
  "fb",
  "concierge",
  "valet",
  "spa",
  "front_desk",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

// ============================================
// STATUS DISPLAY CONFIG
// Uses unified glass styling — only dot color varies
// ============================================

export const STATUS_CONFIG = {
  new: {
    label: "New",
    dotColor: "#a35060",
  },
  pending: {
    label: "Accepted",
    dotColor: "#7e9ab8",
  },
  in_progress: {
    label: "In Progress",
    dotColor: "#c4a06a",
  },
  completed: {
    label: "Completed",
    dotColor: "#7aaa8a",
  },
  cancelled: {
    label: "Cancelled",
    dotColor: "#9ca3af",
  },
} as const;

// ============================================
// CATEGORY CONFIG
// ============================================

export const CATEGORY_ICONS = {
  housekeeping: "Bed",
  maintenance: "Wrench",
  room_service: "Utensils",
  concierge: "Phone",
  valet: "Car",
  spa: "Flower2",
  other: "ClipboardList",
} as const;

export const CATEGORY_LABELS = {
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  room_service: "Room Service",
  concierge: "Concierge",
  valet: "Valet",
  spa: "Spa",
  other: "Other",
} as const;

export const CATEGORY_COLORS = {
  housekeeping: {
    bg: "bg-blue-500/10",
    text: "text-blue-600",
    border: "border-blue-500/20",
    iconBg: "bg-blue-100",
  },
  maintenance: {
    bg: "bg-amber-500/10",
    text: "text-amber-600",
    border: "border-amber-500/20",
    iconBg: "bg-amber-100",
  },
  room_service: {
    bg: "bg-rose-500/10",
    text: "text-rose-600",
    border: "border-rose-500/20",
    iconBg: "bg-rose-100",
  },
  concierge: {
    bg: "bg-violet-500/10",
    text: "text-violet-600",
    border: "border-violet-500/20",
    iconBg: "bg-violet-100",
  },
  valet: {
    bg: "bg-slate-500/10",
    text: "text-slate-600",
    border: "border-slate-500/20",
    iconBg: "bg-slate-100",
  },
  spa: {
    bg: "bg-pink-500/10",
    text: "text-pink-600",
    border: "border-pink-500/20",
    iconBg: "bg-pink-100",
  },
  other: {
    bg: "bg-gray-500/10",
    text: "text-gray-600",
    border: "border-gray-500/20",
    iconBg: "bg-gray-100",
  },
} as const;

// ============================================
// DEPARTMENT COLORS (for staff badges)
// ============================================

export const DEPARTMENT_COLORS: Record<string, string> = {
  housekeeping: "bg-blue-100 text-blue-700",
  maintenance: "bg-orange-100 text-orange-700",
  fb: "bg-amber-100 text-amber-700",
  concierge: "bg-purple-100 text-purple-700",
  valet: "bg-green-100 text-green-700",
  spa: "bg-rose-100 text-rose-700",
  front_desk: "bg-indigo-100 text-indigo-700",
};

export const DEPARTMENT_LABELS: Record<string, string> = {
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  fb: "F&B",
  concierge: "Concierge",
  valet: "Valet",
  spa: "Spa",
  front_desk: "Front Desk",
};

// Department to Category Mapping
export const DEPARTMENT_CATEGORY_MAP: Record<Department, RequestCategory | null> = {
  housekeeping: "housekeeping",
  maintenance: "maintenance",
  fb: "room_service",
  concierge: "concierge",
  valet: "valet",
  spa: "spa",
  front_desk: null,
};

// ============================================
// PRIORITY CONFIG
// ============================================

export const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    bgClass: "bg-gray-100",
    textClass: "text-gray-600",
    borderClass: "border-gray-200",
  },
  medium: {
    label: "Medium",
    bgClass: "bg-blue-100",
    textClass: "text-blue-600",
    borderClass: "border-blue-200",
  },
  high: {
    label: "High",
    bgClass: "bg-orange-100",
    textClass: "text-orange-600",
    borderClass: "border-orange-200",
  },
  urgent: {
    label: "Urgent",
    bgClass: "bg-red-100",
    textClass: "text-red-600",
    borderClass: "border-red-200",
  },
} as const;

// ============================================
// SLA DEFAULTS (in minutes)
// ============================================

export const DEFAULT_SLA: Record<RequestCategory, number> = {
  housekeeping: 30,
  maintenance: 60,
  room_service: 45,
  concierge: 15,
  valet: 20,
  spa: 30,
  other: 60,
};

// ============================================
// ROOM STATUS CONFIG
// ============================================

export const ROOM_STATUS_CONFIG = {
  available: {
    label: "Available",
    bgClass: "bg-success/15",
    textClass: "text-success",
  },
  occupied: {
    label: "Occupied",
    bgClass: "bg-info/15",
    textClass: "text-info",
  },
  maintenance: {
    label: "Maintenance",
    bgClass: "bg-violet-500/15",
    textClass: "text-violet-600",
  },
  cleaning: {
    label: "Cleaning",
    bgClass: "bg-pending/15",
    textClass: "text-pending",
  },
} as const;

// ============================================
// STAY STATUS CONFIG
// ============================================

export const STAY_STATUS_CONFIG = {
  active: {
    label: "Active",
    bgClass: "bg-success/15",
    textClass: "text-success",
  },
  upcoming: {
    label: "Upcoming",
    bgClass: "bg-info/15",
    textClass: "text-info",
  },
  completed: {
    label: "Completed",
    bgClass: "bg-muted/15",
    textClass: "text-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    bgClass: "bg-destructive/15",
    textClass: "text-destructive",
  },
} as const;

// ============================================
// BOOKING STATUS CONFIG
// ============================================

export const BOOKING_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    bgClass: "bg-violet-500/15",
    textClass: "text-violet-600",
  },
  confirmed: {
    label: "Confirmed",
    bgClass: "bg-success/15",
    textClass: "text-success",
  },
  checked_in: {
    label: "Checked In",
    bgClass: "bg-info/15",
    textClass: "text-info",
  },
  checked_out: {
    label: "Checked Out",
    bgClass: "bg-muted/15",
    textClass: "text-muted-foreground",
  },
  cancelled: {
    label: "Cancelled",
    bgClass: "bg-destructive/15",
    textClass: "text-destructive",
  },
} as const;

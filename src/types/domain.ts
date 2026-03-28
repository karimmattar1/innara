// ============================================
// INNARA DOMAIN TYPES
// Shared entity interfaces used across the application.
// These are the APPLICATION-level types — database types
// are generated separately in database.ts.
// ============================================

import type {
  RequestStatus,
  RequestCategory,
  RequestPriority,
} from "@/constants/app";

// Re-export for convenience
export type { RequestStatus, RequestCategory, RequestPriority };

// ============================================
// REQUEST ENTITIES
// ============================================

export interface RequestEntity {
  id: string;
  hotelId: string;
  userId: string;
  guestName: string;
  roomNumber: string;
  category: RequestCategory;
  item: string;
  description: string;
  priority: RequestPriority;
  status: RequestStatus;
  etaMinutes: number | null;
  assignedStaffId: string | null;
  assignedStaffName: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  confirmationNumber: string | null;
  paymentMethod?: string | null;
  chargeStatus?: string | null;
  chargeAmountCents?: number;
  slaBreachedNotified?: boolean;
  photoUrls?: string[];
  internalNotes?: string[];
  guestUpdates?: string[];
}

export interface StatusEvent {
  id: string;
  requestId: string;
  fromStatus: RequestStatus | null;
  toStatus: RequestStatus;
  at: string;
  byRole: "guest" | "staff" | "manager" | "system";
  byName: string;
  note: string | null;
  visibility?: "guest" | "internal" | "all";
}

// ============================================
// STAFF ENTITIES
// ============================================

export interface StaffProfileEntity {
  id: string;
  hotelId: string;
  name: string;
  initials: string;
  department: string;
  role: "staff" | "manager" | "super_admin";
}

export interface ServiceHoursConfig {
  category: string;
  label: string;
  availableFrom: string;
  availableTo: string;
  leadTimeMinutes: number;
}

// ============================================
// MESSAGING ENTITIES
// ============================================

export interface MessageEntity {
  id: string;
  requestId: string | null;
  conversationId: string | null;
  threadType: "guest_staff" | "staff_internal";
  fromRole: "guest" | "staff" | "ai";
  fromName: string;
  fromId: string;
  fromInitials: string;
  body: string;
  at: string;
  isInternal: boolean;
}

export interface StaffConversationEntity {
  id: string;
  hotelId: string;
  participantName: string;
  participantInitials: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

// ============================================
// NOTIFICATION ENTITIES
// ============================================

export type NotificationType =
  | "request_update"
  | "new_request"
  | "guest_message"
  | "staff_message"
  | "sla_breach"
  | "assignment"
  | "other";

export interface NotificationEntity {
  id: string;
  hotelId: string;
  audience: "guest" | "staff" | "manager";
  read: boolean;
  title: string;
  body: string;
  at: string;
  linkTo: string | null;
  notificationType?: NotificationType;
}

export interface GuestNotificationPrefs {
  requestUpdates: boolean;
  staffMessages: boolean;
  promotions: boolean;
  emailNotifications: boolean;
}

export interface ManagerNotificationPrefs {
  slaBreach: boolean;
  newRequest: boolean;
  guestMessage: boolean;
  dailySummary: boolean;
}

export interface NotificationPrefs {
  guest: GuestNotificationPrefs;
  manager: ManagerNotificationPrefs;
}

// ============================================
// AUDIT LOG
// ============================================

export interface AuditLogEntity {
  id: string;
  hotelId: string;
  category: "staff" | "requests" | "settings" | "integrations" | "guests";
  actorName: string;
  actorInitials: string;
  action: string;
  details: string | null;
  at: string;
}

// ============================================
// MULTI-TENANT ENTITIES
// ============================================

export type TenantPlan = "starter" | "professional" | "enterprise";
export type TenantStatus = "active" | "suspended" | "trial";
export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";

export interface TenantEntity {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  maxRooms: number;
  maxStaff: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserInviteEntity {
  id: string;
  hotelId: string;
  email: string;
  role: "staff" | "manager";
  department: string | null;
  status: InviteStatus;
  invitedBy: string;
  createdAt: string;
  expiresAt: string;
}

export interface FeatureFlagEntity {
  id: string;
  hotelId: string;
  key: string;
  enabled: boolean;
  updatedAt: string;
}

// ============================================
// INTEGRATION ENTITIES
// ============================================

export type IntegrationCategory = "pms" | "payments" | "communication" | "analytics";
export type IntegrationStatus = "connected" | "disconnected" | "error";
export type IntegrationLogLevel = "info" | "warn" | "error";

export interface IntegrationEntity {
  id: string;
  hotelId: string;
  key: string;
  name: string;
  category: IntegrationCategory;
  enabled: boolean;
  status: IntegrationStatus;
  credentialsJson: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationMapping {
  id: string;
  hotelId: string;
  integrationKey: string;
  mappingJson: Record<string, string>;
  updatedAt: string;
}

export interface WebhookConfig {
  id: string;
  hotelId: string;
  enabled: boolean;
  endpointUrl: string;
  secretMasked: string;
  eventTypesJson: string[];
  updatedAt: string;
}

export interface IntegrationLogEntry {
  id: string;
  hotelId: string;
  integrationKey: string;
  level: IntegrationLogLevel;
  message: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

// ============================================
// CONCIERGE / AI TYPES
// ============================================

export interface ConciergeChatIntent {
  type:
    | "service_request"
    | "pending_confirmation"
    | "faq"
    | "menu_navigation"
    | "general_chat";
  confidence?: number;
  category?: RequestCategory;
  item?: string;
  quantity?: number;
  timing?: "now" | "30min" | "1hr" | "2hr";
  etaMinutes?: number;
  navigationTarget?: string;
  faqMatch?: { question: string; answer: string };
}

export interface ConciergeChatResponse {
  reply: string;
  intent?: ConciergeChatIntent;
  quickReplies?: string[];
  error?: string;
}

export type ConciergeSender = "guest" | "ai" | "staff";

export interface ConciergeRequestCreated {
  id: string;
  item: string;
  category: string;
  eta?: number;
}

export interface ConciergeChatMessageStored {
  id: string;
  sender: ConciergeSender;
  content: string;
  timestamp: string;
  quickReplies?: string[];
  requestCreated?: ConciergeRequestCreated;
}

export interface ConciergeChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: ConciergeChatMessageStored[];
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface SLACompliance {
  department: string;
  compliance: number;
  target: number;
  requests: number;
}

export interface DepartmentRevenue {
  name: string;
  revenue: number;
  orders: number;
  avgTicket: number;
}

export interface TopStaff {
  name: string;
  tasks: number;
  rating: number;
  avgTime: number;
}

export interface AnalyticsData {
  totalRevenue: number;
  revenueChange: number;
  guestsServed: number;
  guestsChange: number;
  avgSatisfaction: number;
  satisfactionChange: number;
  firstCallResolution: number;
  resolutionChange: number;
  avgResolutionTime: number;
  avgResolutionChange: number;
  slaComplianceOverall: number;
  categoryBreakdown: {
    name: string;
    requests: number;
    revenue: number;
    percentage: number;
  }[];
  peakHours: {
    hour: number;
    label: string;
    requests: number;
    percentage: number;
  }[];
  responseTimeBreakdown: {
    label: string;
    percentage: number;
  }[];
  topStaff: TopStaff[];
  slaCompliance: SLACompliance[];
  departmentRevenue: DepartmentRevenue[];
  taskBreakdown?: {
    name: string;
    requests: number;
    percentage: number;
  }[];
  openRequests?: number;
  inProgressRequests?: number;
  completedRequests?: number;
  departmentLabel?: string;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardRequest {
  id: string;
  guestName: string;
  roomNumber: string;
  category: string;
  item: string;
  status: RequestStatus;
  priority: string;
  createdAt: Date;
  etaMinutes?: number | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
}

export interface DashboardMetrics {
  guestHappiness: number;
  guestHappinessChange: number;
  revenueToday: number;
  revenueChange: number;
  avgResolution: number;
  resolutionChange: number;
  activeRequests: number;
  activeRequestsChange: number;
  guestsServed: number;
  guestsServedChange: number;
  openRequests: number;
  inProgressRequests: number;
  completedToday: number;
  slaCompliance: number;
}

// ============================================
// MENU / ORDER TYPES
// ============================================

export interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  categoryId: string | null;
  categoryName?: string;
  imageUrl: string | null;
  isPopular: boolean;
  isAvailable: boolean;
  allergens: string[] | null;
  hotelId: string;
}

export interface MenuCategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
}

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface CreateOrderInput {
  items: CartItem[];
  hotelId: string;
  roomNumber: string;
  stayId?: string;
  notes?: string;
  tip?: number;
}

// ============================================
// GUEST SERVICE CONFIG TYPES
// ============================================

export interface GuestServiceOption {
  id: string;
  title: string;
  description?: string;
  price?: string;
}

export interface GuestServiceTimeOption {
  id: string;
  label: string;
  minutes: number;
}

export interface GuestServiceTipOption {
  id: string;
  label: string;
  amount: number;
}

export interface GuestServiceConfig {
  id: string;
  title: string;
  subtitle: string;
  category: RequestCategory;
  options: GuestServiceOption[];
  timeOptions?: GuestServiceTimeOption[];
  tipOptions?: GuestServiceTipOption[];
  notesPlaceholder?: string;
  ctaLabel?: string;
}

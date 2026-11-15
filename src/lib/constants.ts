export const WORK_ORDER_STATUSES = [
  "NEW",
  "UNDER_REVIEW",
  "AWAITING_APPROVAL",
  "APPROVED",
  "ASSIGNED",
  "SCHEDULED",
  "IN_PROGRESS",
  "WAITING_FOR_PARTS",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
] as const;

export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const STATUS_FLOW: Record<WorkOrderStatus, WorkOrderStatus[]> = {
  NEW: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["AWAITING_APPROVAL", "NEW", "CANCELLED"],
  AWAITING_APPROVAL: ["APPROVED", "UNDER_REVIEW", "CANCELLED"],
  APPROVED: ["ASSIGNED", "AWAITING_APPROVAL", "CANCELLED"],
  ASSIGNED: ["SCHEDULED", "APPROVED", "CANCELLED"],
  SCHEDULED: ["IN_PROGRESS", "ASSIGNED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_PARTS", "COMPLETED", "SCHEDULED", "CANCELLED"],
  WAITING_FOR_PARTS: ["IN_PROGRESS", "CANCELLED"],
  COMPLETED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
  CANCELLED: ["NEW"],
};

export const MAINTENANCE_CATEGORIES = [
  "PLUMBING",
  "ELECTRICAL",
  "HVAC",
  "APPLIANCE",
  "PEST_CONTROL",
  "CLEANING",
  "LANDSCAPING",
  "PAINTING",
  "CARPENTRY",
  "ROOFING",
  "SECURITY",
  "OTHER",
] as const;

export type MaintenanceCategory = (typeof MAINTENANCE_CATEGORIES)[number];

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT", "EMERGENCY"] as const;

export type Priority = (typeof PRIORITIES)[number];

export const USER_ROLES = [
  "SUPER_ADMIN",
  "PROPERTY_OWNER",
  "PROPERTY_MANAGER",
  "MAINTENANCE_STAFF",
  "CONTRACTOR",
  "TENANT",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const PLAN_TYPES = ["STARTER", "PROFESSIONAL", "BUSINESS", "AGENCY"] as const;

export type PlanType = (typeof PLAN_TYPES)[number];

export const PLAN_UNIT_LIMITS: Record<PlanType, number> = {
  STARTER: 10,
  PROFESSIONAL: 50,
  BUSINESS: 150,
  AGENCY: 999999,
};

export const STATUS_CONFIG: Record<WorkOrderStatus, { label: string; className: string }> = {
  NEW: { label: "New", className: "bg-slate-100 text-slate-700" },
  UNDER_REVIEW: { label: "Under Review", className: "bg-blue-100 text-blue-700" },
  AWAITING_APPROVAL: { label: "Awaiting Approval", className: "bg-amber-100 text-amber-700" },
  APPROVED: { label: "Approved", className: "bg-blue-100 text-blue-700" },
  ASSIGNED: { label: "Assigned", className: "bg-indigo-100 text-indigo-700" },
  SCHEDULED: { label: "Scheduled", className: "bg-purple-100 text-purple-700" },
  IN_PROGRESS: { label: "In Progress", className: "bg-orange-100 text-orange-700" },
  WAITING_FOR_PARTS: { label: "Waiting for Parts", className: "bg-amber-100 text-amber-700" },
  COMPLETED: { label: "Completed", className: "bg-green-100 text-green-700" },
  CLOSED: { label: "Closed", className: "bg-slate-100 text-slate-700" },
  CANCELLED: { label: "Cancelled", className: "bg-red-100 text-red-700" },
};

export const CATEGORY_CONFIG: Record<MaintenanceCategory, { label: string; className: string }> = {
  PLUMBING: { label: "Plumbing", className: "bg-blue-100 text-blue-700" },
  ELECTRICAL: { label: "Electrical", className: "bg-yellow-100 text-yellow-700" },
  HVAC: { label: "HVAC", className: "bg-orange-100 text-orange-700" },
  APPLIANCE: { label: "Appliance", className: "bg-purple-100 text-purple-700" },
  PEST_CONTROL: { label: "Pest Control", className: "bg-green-100 text-green-700" },
  CLEANING: { label: "Cleaning", className: "bg-slate-100 text-slate-700" },
  LANDSCAPING: { label: "Landscaping", className: "bg-green-100 text-green-700" },
  PAINTING: { label: "Painting", className: "bg-red-100 text-red-700" },
  CARPENTRY: { label: "Carpentry", className: "bg-amber-100 text-amber-700" },
  ROOFING: { label: "Roofing", className: "bg-slate-100 text-slate-700" },
  SECURITY: { label: "Security", className: "bg-red-100 text-red-700" },
  OTHER: { label: "Other", className: "bg-slate-100 text-slate-700" },
};

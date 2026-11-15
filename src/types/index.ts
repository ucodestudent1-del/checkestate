export type UserRole =
  | "SUPER_ADMIN"
  | "PROPERTY_OWNER"
  | "PROPERTY_MANAGER"
  | "MAINTENANCE_STAFF"
  | "CONTRACTOR"
  | "TENANT";

export type WorkOrderStatus =
  | "NEW"
  | "UNDER_REVIEW"
  | "AWAITING_APPROVAL"
  | "APPROVED"
  | "ASSIGNED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "WAITING_FOR_PARTS"
  | "COMPLETED"
  | "CLOSED"
  | "CANCELLED";

export type MaintenanceCategory =
  | "PLUMBING"
  | "ELECTRICAL"
  | "HVAC"
  | "APPLIANCE"
  | "PEST_CONTROL"
  | "CLEANING"
  | "LANDSCAPING"
  | "PAINTING"
  | "CARPENTRY"
  | "ROOFING"
  | "SECURITY"
  | "OTHER";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "EMERGENCY";

export type SubscriptionStatus =
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "CANCELED"
  | "UNPAID"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "PAUSED";

export type PlanType = "STARTER" | "PROFESSIONAL" | "BUSINESS" | "AGENCY";

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  organizationId?: string;
  organizationSlug?: string;
  organizationRole?: UserRole;
  isOrganizationOwner?: boolean;
  image?: string | null;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

# CheckEstate Database Schema & Security Architecture

## 1. Database

**Provider:** PostgreSQL  
**ORM:** Prisma  
**Migrations:** Prisma Migrations (version-controlled SQL)

## 2. Security Architecture

### Multi-tenant isolation
- Every organization-owned record carries `organizationId`.
- All backend queries filter by `organizationId` derived from the authenticated user's membership.
- Database row-level security (RLS) policies enforced in PostgreSQL as a defense-in-depth layer.
- No cross-organization joins or queries permitted.

### Authentication & authorization
- Session-based auth with signed JWT cookies (httpOnly, secure, sameSite=strict).
- Role-based access control (RBAC) checked at route/middleware and resolver layers.
- Organization membership required to access org-scoped resources.
- Platform Super Admin bypasses org scoping for system administration.

### Protection layers
- Parameterized queries via Prisma (SQL injection prevention).
- Output encoding + Content Security Policy (XSS prevention).
- CSRF protection on state-changing mutations (Next.js middleware + sameSite cookies).
- Input validation with Zod schemas.
- Secure file uploads (type/size limits, virus scan hook, S3/R2 storage with signed URLs).
- Rate limiting on auth and public endpoints.
- Audit logging for all mutating operations.

## 3. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  SUPER_ADMIN
  PROPERTY_OWNER
  PROPERTY_MANAGER
  MAINTENANCE_STAFF
  CONTRACTOR
  TENANT
}

enum WorkOrderStatus {
  NEW
  UNDER_REVIEW
  AWAITING_APPROVAL
  APPROVED
  ASSIGNED
  SCHEDULED
  IN_PROGRESS
  WAITING_FOR_PARTS
  COMPLETED
  CLOSED
  CANCELLED
}

enum MaintenanceCategory {
  PLUMBING
  ELECTRICAL
  HVAC
  APPLIANCE
  PEST_CONTROL
  CLEANING
  LANDSCAPING
  PAINTING
  CARPENTRY
  ROOFING
  SECURITY
  OTHER
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
  EMERGENCY
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
  INCOMPLETE
  INCOMPLETE_EXPIRED
  PAUSED
}

enum PlanType {
  STARTER
  PROFESSIONAL
  BUSINESS
  AGENCY
}

enum NotificationChannel {
  IN_APP
  EMAIL
}

enum AuditAction {
  CREATE
  UPDATE
  DELETE
  LOGIN
  LOGOUT
  INVITE
  STATUS_CHANGE
  PAYMENT
  SUBSCRIPTION_CHANGE
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String
  firstName     String
  lastName      String
  phone         String?
  avatarUrl     String?
  role          UserRole  @default(TENANT)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  memberships   OrganizationMember[]
  ownedProperties Property[]
  workOrderAssignments WorkOrderAssignment[]
  workOrderComments WorkOrderComment[]
  notifications Notification[]
  auditLogs AuditLog[]
  aiUsageRecords AiUsageRecord[]

  @@index([email])
  @@index([role])
}

model Organization {
  id                String   @id @default(cuid())
  name              String
  slug              String   @unique
  planType          PlanType @default(STARTER)
  subscriptionId    String?
  stripeCustomerId  String?
  stripeSubscriptionId String?
  subscriptionStatus SubscriptionStatus @default(TRIALING)
  subscriptionCurrentPeriodEnd DateTime?
  unitLimit         Int      @default(10)
  aiUsageLimit      Int      @default(0)
  aiUsageCount      Int      @default(0)
  trialEndsAt       DateTime?
  isActive          Boolean  @default(true)
  settings          Json     @default("{}")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  members           OrganizationMember[]
  properties        Property[]
  units             Unit[]
  tenants           Tenant[]
  contractors       Contractor[]
  maintenanceRequests MaintenanceRequest[]
  workOrders        WorkOrder[]
  maintenanceExpenses MaintenanceExpense[]
  notifications     Notification[]
  auditLogs         AuditLog[]
  aiUsageRecords    AiUsageRecord[]
  subscriptionPlans SubscriptionPlan[]

  @@index([slug])
  @@index([planType])
  @@index([subscriptionStatus])
}

model OrganizationMember {
  id             String      @id @default(cuid())
  organizationId String
  userId         String
  role           UserRole
  isOwner        Boolean     @default(false)
  invitedById    String?
  invitedAt      DateTime?
  joinedAt       DateTime?   @default(now())
  isActive       Boolean     @default(true)

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  invitedBy      User?        @relation("Inviter", fields: [invitedById], references: [id])

  @@unique([organizationId, userId])
  @@index([organizationId])
  @@index([userId])
}

model SubscriptionPlan {
  id           String      @id @default(cuid())
  organizationId String
  planType     PlanType
  name         String
  description  String?
  priceMonthly Int         // cents
  priceYearly  Int         // cents
  unitLimit    Int
  features     Json        @default("{}")
  aiUsageLimit Int         @default(0)
  isActive     Boolean     @default(true)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([planType])
}

model Property {
  id           String   @id @default(cuid())
  organizationId String
  name         String
  address      String
  city         String
  state        String
  zipCode      String
  propertyType String
  description  String?
  photoUrls    String[] @default([])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  units        Unit[]
  maintenanceRequests MaintenanceRequest[]
  maintenanceExpenses MaintenanceExpense[]

  @@index([organizationId])
  @@index([city])
  @@index([propertyType])
}

model Unit {
  id           String   @id @default(cuid())
  organizationId String
  propertyId   String
  unitNumber   String
  floor        Int?
  bedrooms     Int?
  bathrooms    Int?
  squareFeet   Int?
  status       String   @default("VACANT") // VACANT, OCCUPIED, MAINTENANCE
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  property     Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  tenant       Tenant?
  maintenanceRequests MaintenanceRequest[]
  maintenanceExpenses MaintenanceExpense[]

  @@index([organizationId])
  @@index([propertyId])
  @@index([unitNumber])
}

model Tenant {
  id           String   @id @default(cuid())
  organizationId String
  unitId       String?
  firstName    String
  lastName     String
  email        String
  phone        String?
  moveInDate   DateTime?
  moveOutDate  DateTime?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  unit         Unit?    @relation(fields: [unitId], references: [id], onDelete: SetNull)
  maintenanceRequests MaintenanceRequest[]

  @@index([organizationId])
  @@index([unitId])
  @@index([email])
}

model TenantInvitation {
  id             String     @id @default(cuid())
  organizationId String
  email          String
  unitId         String?
  token          String     @unique
  invitedById    String
  expiresAt      DateTime
  acceptedAt     DateTime?
  isActive       Boolean    @default(true)

  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  unit           Unit?      @relation(fields: [unitId], references: [id], onDelete: SetNull)
  invitedBy      User       @relation(fields: [invitedById], references: [id])

  @@index([organizationId])
  @@index([token])
  @@index([email])
}

model Contractor {
  id           String   @id @default(cuid())
  organizationId String
  name         String
  businessName String?
  email        String
  phone        String?
  address      String?
  tradeSpecialization String?
  serviceAreas String?
  insuranceInfo String?
  licenseInfo  String?
  documentExpiryDate DateTime?
  notes        String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  documents    ContractorDocument[]
  workOrderAssignments WorkOrderAssignment[]
  maintenanceExpenses MaintenanceExpense[]

  @@index([organizationId])
  @@index([email])
  @@index([tradeSpecialization])
}

model ContractorDocument {
  id           String   @id @default(cuid())
  contractorId String
  fileName     String
  fileUrl      String
  documentType String // insurance, license, etc.
  expiresAt    DateTime?
  uploadedAt   DateTime @default(now())

  contractor   Contractor @relation(fields: [contractorId], references: [id], onDelete: Cascade)

  @@index([contractorId])
}

model MaintenanceRequest {
  id           String   @id @default(cuid())
  organizationId String
  requestNumber String  @unique
  propertyId   String
  unitId       String?
  tenantId     String?
  submittedById String? // tenant user id
  title        String
  description  String
  category     MaintenanceCategory
  priority     Priority @default(MEDIUM)
  submittedAt  DateTime @default(now())
  status       WorkOrderStatus @default(NEW)
  assignedContractorId String?
  estimatedCost Decimal?
  approvedCost Decimal?
  actualCost Decimal?
  appointmentDate DateTime?
  completionDate DateTime?
  internalNotes String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  property         Property   @relation(fields: [propertyId], references: [id])
  unit             Unit?      @relation(fields: [unitId], references: [id], onDelete: SetNull)
  tenant           Tenant?    @relation(fields: [tenantId], references: [id], onDelete: SetNull)
  submittedBy      User?      @relation(fields: [submittedById], references: [id], onDelete: SetNull)
  assignedContractor Contractor? @relation(fields: [assignedContractorId], references: [id], onDelete: SetNull)
  workOrder        WorkOrder?
  comments         WorkOrderComment[]
  attachments      Attachment[]
  activities       WorkOrderActivity[]
  expenses         MaintenanceExpense[]

  @@index([organizationId])
  @@index([requestNumber])
  @@index([status])
  @@index([priority])
  @@index([category])
  @@index([propertyId])
  @@index([unitId])
  @@index([tenantId])
}

model WorkOrder {
  id                 String   @id @default(cuid())
  organizationId     String
  maintenanceRequestId String  @unique
  workOrderNumber    String   @unique
  title              String
  description        String?
  status             WorkOrderStatus @default(NEW)
  assignedToId       String? // staff/contractor user id
  scheduledDate      DateTime?
  completedDate      DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  organization       Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  maintenanceRequest MaintenanceRequest @relation(fields: [maintenanceRequestId], references: [id], onDelete: Cascade)
  assignedTo         User?     @relation(fields: [assignedToId], references: [id], onDelete: SetNull)
  assignments        WorkOrderAssignment[]
  comments           WorkOrderComment[]
  activities         WorkOrderActivity[]

  @@index([organizationId])
  @@index([workOrderNumber])
  @@index([status])
  @@index([maintenanceRequestId])
}

model WorkOrderAssignment {
  id           String   @id @default(cuid())
  organizationId String
  workOrderId  String
  contractorId String
  assignedAt   DateTime @default(now())
  assignedById String?
  notes        String?

  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  workOrder     WorkOrder   @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  contractor    Contractor  @relation(fields: [contractorId], references: [id], onDelete: Cascade)
  assignedBy    User?       @relation(fields: [assignedById], references: [id], onDelete: SetNull)

  @@index([organizationId])
  @@index([workOrderId])
  @@index([contractorId])
}

model WorkOrderComment {
  id           String   @id @default(cuid())
  organizationId String
  workOrderId  String
  authorId     String
  comment      String
  isInternal   Boolean  @default(false)
  createdAt    DateTime @default(now())

  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  workOrder     WorkOrder   @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  author        User        @relation(fields: [authorId], references: [id])

  @@index([organizationId])
  @@index([workOrderId])
  @@index([authorId])
}

model WorkOrderActivity {
  id           String   @id @default(cuid())
  organizationId String
  workOrderId  String
  actorId      String?
  action       String   // status change, assignment, comment, etc.
  fromValue    String?
  toValue      String?
  metadata     Json     @default("{}")
  createdAt    DateTime @default(now())

  organization  Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  workOrder     WorkOrder   @relation(fields: [workOrderId], references: [id], onDelete: Cascade)
  actor         User?      @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([organizationId])
  @@index([workOrderId])
  @@index([createdAt])
}

model Attachment {
  id           String   @id @default(cuid())
  organizationId String
  maintenanceRequestId String?
  workOrderId  String?
  maintenanceExpenseId String?
  fileName     String
  fileUrl      String
  fileType     String
  fileSize     Int
  uploadedById String
  uploadedAt   DateTime @default(now())

  organization        Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  maintenanceRequest  MaintenanceRequest? @relation(fields: [maintenanceRequestId], references: [id], onDelete: SetNull)
  workOrder           WorkOrder?      @relation(fields: [workOrderId], references: [id], onDelete: SetNull)
  maintenanceExpense  MaintenanceExpense? @relation(fields: [maintenanceExpenseId], references: [id], onDelete: SetNull)
  uploadedBy          User            @relation(fields: [uploadedById], references: [id])

  @@index([organizationId])
  @@index([maintenanceRequestId])
  @@index([workOrderId])
  @@index([maintenanceExpenseId])
}

model MaintenanceExpense {
  id           String   @id @default(cuid())
  organizationId String
  propertyId   String?
  unitId       String?
  workOrderId  String?
  contractorId String?
  title        String
  description  String?
  category     MaintenanceCategory
  estimatedCost Decimal?
  approvedCost Decimal?
  actualCost   Decimal
  invoiceNumber String?
  receiptUrl   String?
  expenseDate  DateTime
  paidDate     DateTime?
  paymentStatus String   @default("UNPAID") // UNPAID, PAID, PARTIAL
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  organization     Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  property         Property?   @relation(fields: [propertyId], references: [id], onDelete: SetNull)
  unit             Unit?       @relation(fields: [unitId], references: [id], onDelete: SetNull)
  workOrder        WorkOrder?  @relation(fields: [workOrderId], references: [id], onDelete: SetNull)
  contractor       Contractor? @relation(fields: [contractorId], references: [id], onDelete: SetNull)

  @@index([organizationId])
  @@index([propertyId])
  @@index([unitId])
  @@index([category])
  @@index([expenseDate])
  @@index([paymentStatus])
}

model Notification {
  id           String   @id @default(cuid())
  organizationId String
  userId       String
  title        String
  message      String
  channel      NotificationChannel @default(IN_APP)
  isRead       Boolean  @default(false)
  readAt       DateTime?
  metadata     Json     @default("{}")
  createdAt    DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([organizationId])
  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
}

model AuditLog {
  id           String   @id @default(cuid())
  organizationId String?
  userId       String?
  action       AuditAction
  entityType   String
  entityId     String
  oldValues    Json?
  newValues    Json?
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())

  @@index([organizationId])
  @@index([userId])
  @@index([action])
  @@index([entityType])
  @@index([createdAt])
}

model AiUsageRecord {
  id           String   @id @default(cuid())
  organizationId String
  userId       String
  feature      String
  tokensUsed   Int?
  cost         Decimal?
  createdAt    DateTime @default(now())

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User     @relation(fields: [userId], references: [id])

  @@index([organizationId])
  @@index([userId])
  @@index([feature])
  @@index([createdAt])
}

model EmailLog {
  id           String   @id @default(cuid())
  organizationId String?
  to           String
  template     String
  subject      String
  status       String   @default("PENDING") // PENDING, SENT, FAILED
  sentAt       DateTime?
  idempotencyKey String   @unique
  createdAt    DateTime @default(now())

  @@index([organizationId])
  @@index([idempotencyKey])
  @@index([status])
}
```

## 4. Row-Level Security (PostgreSQL)

Enable RLS on all org-scoped tables and create policies that restrict access to the user's organization via `organizationId` / session variable `app.current_organization_id`.

Example policies (applied via migration):

```sql
ALTER TABLE "Property" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation_property ON "Property"
  USING (organization_id = current_setting('app.current_organization_id', true));
```

Similar policies applied to `Unit`, `Tenant`, `Contractor`, `MaintenanceRequest`, `WorkOrder`, `MaintenanceExpense`, `Notification`, `Attachment`, `WorkOrderActivity`, `WorkOrderComment`, `AuditLog`, `AiUsageRecord`, `EmailLog`.

Super admin bypass: `CREATE POLICY ... USING (current_setting('app.current_user_role', true) = 'SUPER_ADMIN' OR ...)`.

## 5. Indexes & Constraints

- Unique: `User.email`, `Organization.slug`, `OrganizationMember(organizationId, userId)`, `MaintenanceRequest.requestNumber`, `WorkOrder.workOrderNumber`, `WorkOrder.maintenanceRequestId`, `TenantInvitation.token`, `EmailLog.idempotencyKey`.
- Indexes on foreign keys, status, category, priority, dates, email, slug.
- Soft deletion via `isActive` / `deletedAt` where appropriate (Organization, Property, Unit, Tenant, Contractor, User marked `isActive`).

## 6. Migrations

Initial migration creates all tables, indexes, RLS policies, and seed data (default subscription plans). Subsequent migrations version-controlled under `prisma/migrations/`.

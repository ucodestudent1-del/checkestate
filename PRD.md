# CheckEstate Product Requirements Document

**Product:** CheckEstate — Commercial Property Maintenance Management SaaS  
**Version:** 1.0  
**Status:** Draft

## 1. Product Overview

CheckEstate is a multi-tenant, subscription-based SaaS platform that helps independent landlords, rental property owners, and small property management companies manage property repairs, maintenance requests, contractors, and maintenance expenses from a single platform.

Target customers manage approximately 10–150 units.

## 2. User Roles & Access Control

| Role | Description |
|------|-------------|
| Platform Super Administrator | Platform-wide access across all organizations; manages organizations and system config |
| Property Owner | Organization owner; full access to their org's data |
| Property Manager | Manages properties, units, tenants, work orders within their org |
| Maintenance Staff | Internal staff; views/updates assigned work orders |
| Contractor | External; views only work orders assigned to them; updates status |
| Tenant | Submits maintenance requests for their assigned unit; views own requests |

### Access rules
- Users belong to exactly one organization via membership.
- Every organization-owned record carries an `organizationId`.
- Backend enforces organization-level data isolation (no cross-org access).
- Role-based authorization gates actions within an organization.
- Tenants cannot access other tenants' information.
- Contractors only see work orders assigned to them.

## 3. Modules

### Module A: Property Management
- Add, edit, delete properties (with safeguards).
- Add multiple units to a property.
- Assign tenants to units.
- Store addresses, property types, photographs.
- View property maintenance history, open requests, expenses.
- Search, filters, pagination.

### Module B: Tenant Maintenance Portal
- Tenant registration or invitation.
- Access assigned property/unit only.
- Submit maintenance requests (issue, category, urgency, photos, comments).
- Track repair progress; receive status notifications.
- View previous requests.
- No access to other tenants' data.

### Module C: Maintenance Request Management (Work Orders)
Fields: unique request number, property, unit, tenant, issue description, category, priority, submitted date, assigned contractor, estimated cost, approved cost, actual cost, appointment date, completion date, status, internal notes, attachments, activity history.

Statuses: New, Under Review, Awaiting Approval, Approved, Assigned, Scheduled, In Progress, Waiting for Parts, Completed, Closed, Cancelled.

- Visual maintenance workflow.
- Authorized users update statuses.
- Every status change recorded in activity history.

### Module D: Contractor Management
Fields: name, business name, email, phone, address, trade specialization, service areas, insurance info, license info, document expiry dates, notes, assigned work orders, performance history.
- Property managers assign contractors to jobs.
- Contractor portal with restricted permissions (only assigned work orders).

### Module E: Maintenance Expense Management
- Estimated vs. approved vs. actual costs.
- Contractor invoices, receipt uploads.
- Property-specific expenses, monthly summaries, category-based reporting.
- Reporting by property and date range.
- Not a complete accounting system.

### Module F: Notifications
Triggers: new tenant requests, urgent requests, contractor assignments, appointment scheduling, status changes, completed work orders, approval requests, upcoming document expirations.
- In-app + transactional email.
- Background jobs/queue for email.
- Duplicate prevention.

### Module G: Dashboard & Analytics
Scoped to logged-in organization:
- Total properties, units.
- Open, urgent, awaiting approval, scheduled, completed requests.
- Monthly expenses, average resolution time.
- Requests by category.
- Charts + filters.

### Module H: AI Maintenance Assistant (optional, configurable, usage-limited)
- Summarize requests, categorize descriptions, suggest contractor trade.
- Draft work order descriptions, identify potentially urgent requests.
- Generate maintenance summaries.
- Safety: never auto-dismiss urgent requests; never declare dangerous situations safe; flag emergencies; human approval before consequential actions; no invented qualifications/estimates.

## 4. Subscription & Payments

Plans (configurable):
- STARTER — $29/mo — up to 10 units — basic property mgmt, maintenance requests, contractor directory, standard dashboard.
- PROFESSIONAL — $59/mo — up to 50 units — + advanced work orders, expense tracking, email notifications, reporting.
- BUSINESS — $99/mo — up to 150 units — + multiple staff, advanced analytics, AI with usage limits, priority support.
- AGENCY — $199/mo — larger portfolios, expanded staff, advanced reporting, org management.

Features:
- Subscription checkout, monthly & annual billing, free trial (if enabled).
- Upgrades, downgrades, cancellation.
- Failed payment handling, billing history, customer billing portal.
- Webhook processing (idempotent).
- Subscription entitlement enforcement (server-side verified; never frontend state).

## 5. Authentication & Security

- Secure registration, login, logout, email verification, password reset.
- Secure password storage (bcrypt/argon2), session management.
- RBAC + org-level access controls, API protection.
- Rate limiting, input validation, secure file uploads, audit logging.
- Protection: SQL injection, XSS, CSRF, IDOR, privilege escalation, unauthorized data access.
- No credentials/private keys in frontend.

## 6. Database Architecture

Relational (PostgreSQL). Entities: Users, Organizations, Organization memberships, Subscription plans, Subscriptions, Properties, Units, Tenants, Tenant invitations, Contractors, Contractor documents, Maintenance requests, Work orders, Work order assignments, Work order comments, Attachments, Maintenance expenses, Notifications, Audit logs, AI usage records.

- Foreign keys, indexes, unique constraints, validation, transactions, timestamps, soft deletes.
- Every org-owned record has `organizationId`.
- Org-level isolation enforced at backend + database layer.
- Reliable migrations.

## 7. UI/UX

Premium modern SaaS: clean professional, light neutral backgrounds, navy/blue accents, clear typography, consistent spacing, professional cards, clean data tables, attractive charts, intuitive navigation, responsive.

Pages: marketing landing, pricing, registration, login, onboarding wizard, main dashboard, properties, property details, units, maintenance requests, work order details, contractor directory, contractor details, expense management, reports/analytics, notifications, settings, subscription management, tenant portal, contractor portal, platform admin dashboard.

## 8. Marketing Website

Headline: "Property Maintenance, Finally Under Control."  
Subheadline: "Manage maintenance requests, contractors, repairs, and property expenses from one simple platform."

Sections: hero, product screenshots, key benefits, feature overview, how it works, pricing comparison, FAQ, CTA, contact, footer, privacy policy, terms of service. Honest marketing; no fabricated testimonials/numbers. SEO optimized.

## 9. Non-Functional Requirements

- Multi-tenant data isolation.
- Mobile responsive (desktop, tablet, mobile).
- Strong typing (TypeScript).
- Automated tests (registration, auth, role permissions, org isolation, properties, units, tenant invites, maintenance requests, work orders, contractor permissions, expenses, notifications, subscription checkout, webhooks, entitlements, cancellation).
- Production build, env vars, migrations, auth config, payment config, email delivery, file storage, HTTPS, error monitoring, logging, backups, recovery, deployment config, rollback, security scanning.

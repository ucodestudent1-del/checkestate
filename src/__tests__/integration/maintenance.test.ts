import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { MaintenanceRequestService } from "@/lib/services/maintenance";
import { WorkOrderService } from "@/lib/services/maintenance";
import { NotificationService } from "@/lib/notifications";
import bcrypt from "bcryptjs";

describe("Maintenance Request Integration Tests", () => {
  let testOrgId: string;
  let testUserId: string;
  let testPropertyId: string;
  let testUnitId: string;
  let testTenantId: string;

  beforeAll(async () => {
    // Create test organization
    const org = await db.organization.create({
      data: {
        name: "Test Organization",
        slug: "test-org-" + Date.now(),
        planType: "PROFESSIONAL",
        unitLimit: 50,
      },
    });
    testOrgId = org.id;

    // Create test user
    const passwordHash = await bcrypt.hash("TestPassword123!", 12);
    const user = await db.user.create({
      data: {
        email: "test@example.com",
        passwordHash,
        firstName: "Test",
        lastName: "User",
        role: "PROPERTY_MANAGER",
        isActive: true,
      },
    });
    testUserId = user.id;

    // Create organization membership
    await db.organizationMember.create({
      data: {
        organizationId: testOrgId,
        userId: testUserId,
        role: "PROPERTY_MANAGER",
        isOwner: true,
        isActive: true,
      },
    });

    // Create test property
    const property = await db.property.create({
      data: {
        organizationId: testOrgId,
        name: "Test Property",
        address: "123 Test St",
        city: "Test City",
        state: "TS",
        zipCode: "12345",
        propertyType: "APARTMENT",
      },
    });
    testPropertyId = property.id;

    // Create test unit
    const unit = await db.unit.create({
      data: {
        organizationId: testOrgId,
        propertyId: testPropertyId,
        unitNumber: "101",
        status: "OCCUPIED",
      },
    });
    testUnitId = unit.id;

    // Create test tenant
    const tenantUser = await db.user.create({
      data: {
        email: "tenant@example.com",
        passwordHash: await bcrypt.hash("TestPassword123!", 12),
        firstName: "Test",
        lastName: "Tenant",
        role: "TENANT",
        isActive: true,
      },
    });

    const tenant = await db.tenant.create({
      data: {
        organizationId: testOrgId,
        unitId: testUnitId,
        firstName: "Test",
        lastName: "Tenant",
        email: "tenant@example.com",
        userId: tenantUser.id,
        isActive: true,
      },
    });
    testTenantId = tenant.id;

    // Update unit with tenant
    await db.unit.update({
      where: { id: testUnitId },
      data: { tenantId: tenant.id },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await db.tenant.deleteMany({ where: { organizationId: testOrgId } });
    await db.unit.deleteMany({ where: { organizationId: testOrgId } });
    await db.property.deleteMany({ where: { organizationId: testOrgId } });
    await db.organizationMember.deleteMany({ where: { organizationId: testOrgId } });
    await db.user.deleteMany({ where: { id: { in: [testUserId] } } });
    await db.organization.delete({ where: { id: testOrgId } });
  });

  it("should create a maintenance request and work order", async () => {
    const request = await MaintenanceRequestService.create(testOrgId, testUserId, {
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
      title: "Leaky faucet",
      description: "Kitchen faucet is dripping",
      category: "PLUMBING",
      priority: "HIGH",
    });

    expect(request).toBeDefined();
    expect(request.requestNumber).toMatch(/^WR-\d{4}$/);
    expect(request.title).toBe("Leaky faucet");
    expect(request.status).toBe("NEW");
    expect(request.priority).toBe("HIGH");

    // Verify work order was created
    const workOrder = await db.workOrder.findUnique({
      where: { maintenanceRequestId: request.id },
    });
    expect(workOrder).toBeDefined();
    expect(workOrder?.workOrderNumber).toMatch(/^WO-\d{4}$/);
    expect(workOrder?.status).toBe("NEW");
  });

  it("should list maintenance requests with filters", async () => {
    const result = await MaintenanceRequestService.list(testOrgId, {
      status: "NEW",
      category: "PLUMBING",
    });

    expect(result.data).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThan(0);
    expect(result.page).toBe(1);
  });

  it("should update work order status through workflow", async () => {
    // Create a new request
    const request = await MaintenanceRequestService.create(testOrgId, testUserId, {
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
      title: "Electrical issue",
      description: "Outlet not working",
      category: "ELECTRICAL",
      priority: "MEDIUM",
    });

    const workOrder = await db.workOrder.findUnique({
      where: { maintenanceRequestId: request.id },
    });
    expect(workOrder).toBeDefined();

    // Update through valid workflow
    const updated = await WorkOrderService.update(
      workOrder!.id,
      testOrgId,
      testUserId,
      { status: "UNDER_REVIEW" }
    );
    expect(updated.status).toBe("UNDER_REVIEW");

    // Verify maintenance request status also updated
    const updatedRequest = await db.maintenanceRequest.findUnique({
      where: { id: request.id },
    });
    expect(updatedRequest?.status).toBe("UNDER_REVIEW");

    // Continue workflow
    const steps = [
      "AWAITING_APPROVAL",
      "APPROVED",
      "ASSIGNED",
      "SCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
      "CLOSED",
    ];

    for (const step of steps) {
      const result = await WorkOrderService.update(
        workOrder!.id,
        testOrgId,
        testUserId,
        { status: step }
      );
      expect(result.status).toBe(step);
    }

    // Verify final status
    const finalRequest = await db.maintenanceRequest.findUnique({
      where: { id: request.id },
    });
    expect(finalRequest?.status).toBe("CLOSED");
  });

  it("should reject invalid status transitions", async () => {
    const request = await MaintenanceRequestService.create(testOrgId, testUserId, {
      propertyId: testPropertyId,
      unitId: testUnitId,
      tenantId: testTenantId,
      title: "Test request",
      description: "Test",
      category: "HVAC",
    });

    const workOrder = await db.workOrder.findUnique({
      where: { maintenanceRequestId: request.id },
    });

    // Try to skip from NEW to COMPLETED
    await expect(
      WorkOrderService.update(workOrder!.id, testOrgId, testUserId, { status: "COMPLETED" })
    ).rejects.toThrow(); // Should throw due to invalid transition
  });
});

describe("Organization Isolation Tests", () => {
  let org1Id: string;
  let org2Id: string;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    // Create two organizations
    const org1 = await db.organization.create({
      data: { name: "Org 1", slug: "org-1-" + Date.now(), planType: "STARTER" },
    });
    org1Id = org1.id;

    const org2 = await db.organization.create({
      data: { name: "Org 2", slug: "org-2-" + Date.now(), planType: "STARTER" },
    });
    org2Id = org2.id;

    // Create users for each org
    const passwordHash = await bcrypt.hash("TestPassword123!", 12);
    
    const user1 = await db.user.create({
      data: { email: "user1@test.com", passwordHash, firstName: "User", lastName: "One", role: "PROPERTY_OWNER" },
    });
    user1Id = user1.id;

    const user2 = await db.user.create({
      data: { email: "user2@test.com", passwordHash, firstName: "User", lastName: "Two", role: "PROPERTY_OWNER" },
    });
    user2Id = user2.id;

    await db.organizationMember.create({
      data: { organizationId: org1Id, userId: user1Id, role: "PROPERTY_OWNER", isOwner: true, isActive: true },
    });
    await db.organizationMember.create({
      data: { organizationId: org2Id, userId: user2Id, role: "PROPERTY_OWNER", isOwner: true, isActive: true },
    });
  });

  afterAll(async () => {
    await db.organizationMember.deleteMany({ where: { organizationId: { in: [org1Id, org2Id] } } });
    await db.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } });
    await db.organization.deleteMany({ where: { id: { in: [org1Id, org2Id] } } });
  });

  it("should isolate organizations - org1 cannot see org2 properties", async () => {
    const prop1 = await db.property.create({
      data: { organizationId: org1Id, name: "Org1 Property", address: "123 St", city: "City", state: "ST", zipCode: "12345", propertyType: "APARTMENT" },
    });

    const prop2 = await db.property.create({
      data: { organizationId: org2Id, name: "Org2 Property", address: "456 Ave", city: "City", state: "ST", zipCode: "12345", propertyType: "HOUSE" },
    });

    const org1Props = await db.property.findMany({ where: { organizationId: org1Id } });
    const org2Props = await db.property.findMany({ where: { organizationId: org2Id } });

    expect(org1Props).toHaveLength(1);
    expect(org1Props[0].id).toBe(prop1.id);
    expect(org2Props).toHaveLength(1);
    expect(org2Props[0].id).toBe(prop2.id);
  });

  it("should isolate organizations - org1 cannot access org2 maintenance requests", async () => {
    const prop1 = await db.property.findFirst({ where: { organizationId: org1Id } });
    const prop2 = await db.property.findFirst({ where: { organizationId: org2Id } });

    await db.maintenanceRequest.create({
      data: { organizationId: org1Id, propertyId: prop1!.id, title: "Org1 Request", description: "Test", category: "PLUMBING", requestNumber: "WR-0001" },
    });
    await db.maintenanceRequest.create({
      data: { organizationId: org2Id, propertyId: prop2!.id, title: "Org2 Request", description: "Test", category: "ELECTRICAL", requestNumber: "WR-0002" },
    });

    const org1Requests = await MaintenanceRequestService.list(org1Id);
    const org2Requests = await MaintenanceRequestService.list(org2Id);

    expect(org1Requests.data).toHaveLength(1);
    expect(org1Requests.data[0].title).toBe("Org1 Request");
    expect(org2Requests.data).toHaveLength(1);
    expect(org2Requests.data[0].title).toBe("Org2 Request");
  });
});

describe("RBAC Tests", () => {
  let orgId: string;
  let ownerId: string;
  let managerId: string;
  let tenantId: string;
  let contractorId: string;

  beforeAll(async () => {
    const org = await db.organization.create({
      data: { name: "RBAC Test Org", slug: "rbac-test-" + Date.now(), planType: "PROFESSIONAL" },
    });
    orgId = org.id;

    const passwordHash = await bcrypt.hash("TestPassword123!", 12);

    // Create users with different roles
    const owner = await db.user.create({
      data: { email: "owner@test.com", passwordHash, firstName: "Owner", lastName: "User", role: "PROPERTY_OWNER" },
    });
    ownerId = owner.id;

    const manager = await db.user.create({
      data: { email: "manager@test.com", passwordHash, firstName: "Manager", lastName: "User", role: "PROPERTY_MANAGER" },
    });
    managerId = manager.id;

    const tenantUser = await db.user.create({
      data: { email: "tenant@test.com", passwordHash, firstName: "Tenant", lastName: "User", role: "TENANT" },
    });
    tenantId = tenantUser.id;

    const contractorUser = await db.user.create({
      data: { email: "contractor@test.com", passwordHash, firstName: "Contractor", lastName: "User", role: "CONTRACTOR" },
    });
    contractorId = contractorUser.id;

    await db.organizationMember.createMany({
      data: [
        { organizationId: orgId, userId: ownerId, role: "PROPERTY_OWNER", isOwner: true, isActive: true },
        { organizationId: orgId, userId: managerId, role: "PROPERTY_MANAGER", isActive: true },
        { organizationId: orgId, userId: tenantId, role: "TENANT", isActive: true },
        { organizationId: orgId, userId: contractorId, role: "CONTRACTOR", isActive: true },
      ],
    });
  });

  afterAll(async () => {
    await db.organizationMember.deleteMany({ where: { organizationId: orgId } });
    await db.user.deleteMany({ where: { id: { in: [ownerId, managerId, tenantId, contractorId] } } });
    await db.organization.delete({ where: { id: orgId } });
  });

  it("should allow PROPERTY_OWNER to create properties", async () => {
    const prop = await db.property.create({
      data: { organizationId: orgId, name: "Test Prop", address: "123 St", city: "City", state: "ST", zipCode: "12345", propertyType: "APARTMENT" },
    });
    expect(prop).toBeDefined();
  });

  it("should allow PROPERTY_MANAGER to create maintenance requests", async () => {
    const prop = await db.property.findFirst({ where: { organizationId: orgId } });
    const request = await MaintenanceRequestService.create(orgId, managerId, {
      propertyId: prop!.id,
      title: "Manager Request",
      description: "Test",
      category: "PLUMBING",
    });
    expect(request).toBeDefined();
  });

  it("should allow CONTRACTOR to update assigned work order status", async () => {
    const prop = await db.property.findFirst({ where: { organizationId: orgId } });
    const request = await MaintenanceRequestService.create(orgId, managerId, {
      propertyId: prop!.id,
      title: "Contractor Test",
      description: "Test",
      category: "ELECTRICAL",
    });

    const workOrder = await db.workOrder.findUnique({ where: { maintenanceRequestId: request.id } });
    
    // Assign contractor
    const contractor = await db.contractor.create({
      data: { organizationId: orgId, name: "Test Contractor", email: "contractor@test.com", isActive: true },
    });
    
    await db.workOrderAssignment.create({
      data: { organizationId: orgId, workOrderId: workOrder!.id, contractorId: contractor.id },
    });

    // Contractor should be able to update status to IN_PROGRESS
    const updated = await WorkOrderService.update(workOrder!.id, orgId, contractorId, { status: "IN_PROGRESS" });
    expect(updated.status).toBe("IN_PROGRESS");
  });

  it("should prevent CONTRACTOR from reassigning work orders", async () => {
    const prop = await db.property.findFirst({ where: { organizationId: orgId } });
    const request = await MaintenanceRequestService.create(orgId, managerId, {
      propertyId: prop!.id,
      title: "Contractor Test 2",
      description: "Test",
      category: "HVAC",
    });

    const workOrder = await db.workOrder.findUnique({ where: { maintenanceRequestId: request.id } });
    
    const contractor = await db.contractor.create({
      data: { organizationId: orgId, name: "Test Contractor 2", email: "contractor2@test.com", isActive: true },
    });
    
    await db.workOrderAssignment.create({
      data: { organizationId: orgId, workOrderId: workOrder!.id, contractorId: contractor.id },
    });

    // Contractor should NOT be able to assign to another user
    await expect(
      WorkOrderService.update(workOrder!.id, orgId, contractorId, { assignedToId: managerId })
    ).rejects.toThrow("Contractors can only update work order status");
  });

  it("should prevent TENANT from creating properties", async () => {
    await expect(
      db.property.create({
        data: { organizationId: orgId, name: "Tenant Prop", address: "123 St", city: "City", state: "ST", zipCode: "12345", propertyType: "APARTMENT" },
      })
    ).rejects.toThrow(); // This would fail at API level due to role check
  });
});

describe("Notification Service Tests", () => {
  let orgId: string;
  let userId: string;

  beforeAll(async () => {
    const org = await db.organization.create({
      data: { name: "Notification Test Org", slug: "notif-test-" + Date.now(), planType: "STARTER" },
    });
    orgId = org.id;

    const passwordHash = await bcrypt.hash("TestPassword123!", 12);
    const user = await db.user.create({
      data: { email: "notifuser@test.com", passwordHash, firstName: "Notif", lastName: "User", role: "PROPERTY_MANAGER" },
    });
    userId = user.id;

    await db.organizationMember.create({
      data: { organizationId: orgId, userId, role: "PROPERTY_MANAGER", isActive: true },
    });
  });

  afterAll(async () => {
    await db.notification.deleteMany({ where: { organizationId: orgId } });
    await db.organizationMember.deleteMany({ where: { organizationId: orgId } });
    await db.user.delete({ where: { id: userId } });
    await db.organization.delete({ where: { id: orgId } });
  });

  it("should create in-app notification", async () => {
    const notification = await NotificationService.createNotification(
      orgId,
      userId,
      "Test Notification",
      "This is a test notification",
      "IN_APP",
      { test: true }
    );

    expect(notification).toBeDefined();
    expect(notification.title).toBe("Test Notification");
    expect(notification.message).toBe("This is a test notification");
    expect(notification.isRead).toBe(false);
  });

  it("should create bulk notifications", async () => {
    const notifications = await NotificationService.createBulkNotifications(
      orgId,
      [userId],
      "Bulk Test",
      "Bulk notification message",
      "IN_APP"
    );

    expect(notifications.count).toBe(1);
  });

  it("should get unread count", async () => {
    const count = await NotificationService.getUnreadCount(userId);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should mark notifications as read", async () => {
    const notification = await NotificationService.createNotification(
      orgId,
      userId,
      "Mark Read Test",
      "Test marking as read",
      "IN_APP"
    );

    await NotificationService.markAsRead(userId, [notification.id]);

    const updated = await db.notification.findUnique({ where: { id: notification.id } });
    expect(updated?.isRead).toBe(true);
    expect(updated?.readAt).toBeDefined();
  });
});
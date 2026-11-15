import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function seedSubscriptionPlans() {
  const plans = [
    {
      planType: "STARTER" as const,
      name: "Starter",
      description: "Ideal for independent landlords with a small portfolio.",
      priceMonthly: 2900,
      priceYearly: 29000,
      unitLimit: 10,
      aiUsageLimit: 0,
      features: {
        properties: true,
        units: true,
        maintenanceRequests: true,
        contractorDirectory: true,
        standardDashboard: true,
        advancedWorkOrders: false,
        expenseTracking: false,
        emailNotifications: false,
        maintenanceReporting: false,
        multipleStaff: false,
        advancedAnalytics: false,
        aiMaintenance: false,
        prioritySupport: false,
      },
    },
    {
      planType: "PROFESSIONAL" as const,
      name: "Professional",
      description: "For growing property management operations.",
      priceMonthly: 5900,
      priceYearly: 59000,
      unitLimit: 50,
      aiUsageLimit: 0,
      features: {
        properties: true,
        units: true,
        maintenanceRequests: true,
        contractorDirectory: true,
        standardDashboard: true,
        advancedWorkOrders: true,
        expenseTracking: true,
        emailNotifications: true,
        maintenanceReporting: true,
        multipleStaff: false,
        advancedAnalytics: false,
        aiMaintenance: false,
        prioritySupport: false,
      },
    },
    {
      planType: "BUSINESS" as const,
      name: "Business",
      description: "For established property managers with larger portfolios.",
      priceMonthly: 9900,
      priceYearly: 99000,
      unitLimit: 150,
      aiUsageLimit: 1000,
      features: {
        properties: true,
        units: true,
        maintenanceRequests: true,
        contractorDirectory: true,
        standardDashboard: true,
        advancedWorkOrders: true,
        expenseTracking: true,
        emailNotifications: true,
        maintenanceReporting: true,
        multipleStaff: true,
        advancedAnalytics: true,
        aiMaintenance: true,
        prioritySupport: true,
      },
    },
    {
      planType: "AGENCY" as const,
      name: "Agency",
      description: "For larger property portfolios and multi-organization management.",
      priceMonthly: 19900,
      priceYearly: 199000,
      unitLimit: 999999,
      aiUsageLimit: 5000,
      features: {
        properties: true,
        units: true,
        maintenanceRequests: true,
        contractorDirectory: true,
        standardDashboard: true,
        advancedWorkOrders: true,
        expenseTracking: true,
        emailNotifications: true,
        maintenanceReporting: true,
        multipleStaff: true,
        advancedAnalytics: true,
        aiMaintenance: true,
        prioritySupport: true,
      },
    },
  ];

  for (const plan of plans) {
    await db.subscriptionPlan.upsert({
      where: { planType: plan.planType },
      update: plan,
      create: plan,
    });
  }

  console.log("Seeded subscription plans");
}

async function seedDevelopmentData() {
  if (process.env.NODE_ENV === "production") {
    console.log("Skipping development seed in production");
    return;
  }

  const passwordHash = await bcrypt.hash("TestPassword123!", 12);

  // Create demo organization
  const demoOrg = await db.organization.upsert({
    where: { slug: "demo-org" },
    update: {},
    create: {
      name: "Demo Property Management",
      slug: "demo-org",
      planType: "PROFESSIONAL",
      unitLimit: 50,
      subscriptionStatus: "ACTIVE",
      isActive: true,
    },
  });

  // Create demo users
  const demoUsers = await Promise.all([
    db.user.upsert({
      where: { email: "owner@demo.com" },
      update: {},
      create: {
        email: "owner@demo.com",
        passwordHash: await bcrypt.hash("Demo123!", 12),
        firstName: "Demo",
        lastName: "Owner",
        role: "PROPERTY_OWNER",
        isActive: true,
      },
    }),
    db.user.upsert({
      where: { email: "manager@demo.com" },
      update: {},
      create: {
        email: "manager@demo.com",
        passwordHash: await bcrypt.hash("Demo123!", 12),
        firstName: "Demo",
        lastName: "Manager",
        role: "PROPERTY_MANAGER",
        isActive: true,
      },
    }),
    db.user.upsert({
      where: { email: "tenant@demo.com" },
      update: {},
      create: {
        email: "tenant@demo.com",
        passwordHash: await bcrypt.hash("Demo123!", 12),
        firstName: "Demo",
        lastName: "Tenant",
        role: "TENANT",
        isActive: true,
      },
    }),
    db.user.upsert({
      where: { email: "contractor@demo.com" },
      update: {},
      create: {
        email: "contractor@demo.com",
        passwordHash: await bcrypt.hash("Demo123!", 12),
        firstName: "Demo",
        lastName: "Contractor",
        role: "CONTRACTOR",
        isActive: true,
      },
    }),
  ]);

  const [owner, manager, tenantUser, contractorUser] = demoUsers;

  // Create organization memberships
  await db.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: demoOrg.id, userId: owner.id } },
    update: {},
    create: {
      organizationId: demoOrg.id,
      userId: owner.id,
      role: "PROPERTY_OWNER",
      isOwner: true,
      isActive: true,
    },
  });

  await db.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: demoOrg.id, userId: manager.id } },
    update: {},
    create: {
      organizationId: demoOrg.id,
      userId: manager.id,
      role: "PROPERTY_MANAGER",
      isActive: true,
    },
  });

  await db.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: demoOrg.id, userId: tenantUser.id } },
    update: {},
    create: {
      organizationId: demoOrg.id,
      userId: tenantUser.id,
      role: "TENANT",
      isActive: true,
    },
  });

  await db.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: demoOrg.id, userId: contractorUser.id } },
    update: {},
    create: {
      organizationId: demoOrg.id,
      userId: contractorUser.id,
      role: "CONTRACTOR",
      isActive: true,
    },
  });

  // Create demo properties
  const property1 = await db.property.upsert({
    where: { id: "demo-prop-1" },
    update: {},
    create: {
      id: "demo-prop-1",
      organizationId: demoOrg.id,
      name: "Sunset Apartments",
      address: "123 Sunset Boulevard",
      city: "Los Angeles",
      state: "CA",
      zipCode: "90028",
      propertyType: "APARTMENT",
      description: "12-unit apartment building in Hollywood",
    },
  });

  const property2 = await db.property.upsert({
    where: { id: "demo-prop-2" },
    update: {},
    create: {
      id: "demo-prop-2",
      organizationId: demoOrg.id,
      name: "Downtown Lofts",
      address: "456 Main Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      propertyType: "COMMERCIAL",
      description: "Mixed-use building with retail and residential",
    },
  });

  // Create units
  const units = await Promise.all([
    db.unit.upsert({
      where: { id: "demo-unit-1" },
      update: {},
      create: {
        id: "demo-unit-1",
        organizationId: demoOrg.id,
        propertyId: property1.id,
        unitNumber: "101",
        floor: 1,
        bedrooms: 2,
        bathrooms: 1,
        squareFeet: 850,
        status: "OCCUPIED",
      },
    }),
    db.unit.upsert({
      where: { id: "demo-unit-2" },
      update: {},
      create: {
        id: "demo-unit-2",
        organizationId: demoOrg.id,
        propertyId: property1.id,
        unitNumber: "102",
        floor: 1,
        bedrooms: 1,
        bathrooms: 1,
        squareFeet: 650,
        status: "VACANT",
      },
    }),
    db.unit.upsert({
      where: { id: "demo-unit-3" },
      update: {},
      create: {
        id: "demo-unit-3",
        organizationId: demoOrg.id,
        propertyId: property2.id,
        unitNumber: "201",
        floor: 2,
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1200,
        status: "OCCUPIED",
      },
    }),
  ]);

  const [unit1, unit2, unit3] = units;

  // Create tenant
  const tenant = await db.tenant.upsert({
    where: { id: "demo-tenant-1" },
    update: {},
    create: {
      id: "demo-tenant-1",
      organizationId: demoOrg.id,
      unitId: unit1.id,
      firstName: "John",
      lastName: "Doe",
      email: "john.doe@example.com",
      phone: "+1-555-0123",
      moveInDate: new Date("2024-01-15"),
      isActive: true,
      userId: demoUsers[2].id,
    },
  });

  // Update unit with tenant
  await db.unit.update({
    where: { id: unit1.id },
    data: { tenantId: tenant.id },
  });

  // Create contractor
  const contractor = await db.contractor.upsert({
    where: { id: "demo-contractor-1" },
    update: {},
    create: {
      id: "demo-contractor-1",
      organizationId: demoOrg.id,
      name: "Bob's Plumbing & Repair",
      businessName: "Bob's Plumbing & Repair LLC",
      email: "bob@plumbing.com",
      phone: "+1-555-0199",
      address: "789 Service Road, Los Angeles, CA 90001",
      tradeSpecialization: "PLUMBING",
      serviceAreas: "Los Angeles, Hollywood, West Hollywood",
      insuranceInfo: "General Liability $1M, Workers Comp",
      licenseInfo: "CA License #123456",
      documentExpiryDate: new Date("2025-12-31"),
      isActive: true,
    },
  });

  // Create maintenance request
  const request = await db.maintenanceRequest.upsert({
    where: { id: "demo-request-1" },
    update: {},
    create: {
      id: "demo-request-1",
      organizationId: demoOrg.id,
      requestNumber: "WR-0001",
      propertyId: property1.id,
      unitId: unit1.id,
      tenantId: tenant.id,
      submittedById: demoUsers[2].id,
      title: "Kitchen faucet leaking",
      description: "The kitchen faucet has been dripping steadily for 3 days. Water is pooling under the sink.",
      category: "PLUMBING",
      priority: "HIGH",
      status: "NEW",
    },
  });

  // Create work order
  await db.workOrder.upsert({
    where: { id: "demo-wo-1" },
    update: {},
    create: {
      id: "demo-wo-1",
      organizationId: demoOrg.id,
      maintenanceRequestId: request.id,
      workOrderNumber: "WO-0001",
      title: "Kitchen faucet leaking",
      description: "The kitchen faucet has been dripping steadily for 3 days. Water is pooling under the sink.",
      status: "ASSIGNED",
    },
  });

  // Create work order assignment
  await db.workOrderAssignment.upsert({
    where: { id: "demo-wo-assignment-1" },
    update: {},
    create: {
      id: "demo-wo-assignment-1",
      organizationId: demoOrg.id,
      workOrderId: "demo-wo-1",
      contractorId: contractor.id,
    },
  });

  // Create maintenance expense
  await db.maintenanceExpense.upsert({
    where: { id: "demo-expense-1" },
    update: {},
    create: {
      id: "demo-expense-1",
      organizationId: demoOrg.id,
      propertyId: property1.id,
      workOrderId: "demo-wo-1",
      contractorId: contractor.id,
      title: "Faucet replacement",
      description: "Replaced kitchen faucet cartridge and supply lines",
      category: "PLUMBING",
      estimatedCost: 150.00,
      approvedCost: 150.00,
      actualCost: 142.50,
      invoiceNumber: "INV-2024-001",
      expenseDate: new Date("2024-01-20"),
      paidDate: new Date("2024-01-22"),
      paymentStatus: "PAID",
    },
  });

  // Create contractor document
  await db.contractorDocument.upsert({
    where: { id: "demo-doc-1" },
    update: {},
    create: {
      id: "demo-doc-1",
      contractorId: contractor.id,
      fileName: "insurance_certificate.pdf",
      fileUrl: "https://example.com/docs/insurance_certificate.pdf",
      documentType: "Insurance Certificate",
      expiresAt: new Date("2025-12-31"),
    },
  });

  // Create notifications
  await db.notification.createMany({
    data: [
      {
        organizationId: demoOrg.id,
        userId: demoUsers[0].id,
        title: "New Maintenance Request",
        message: "Request WR-0001 submitted for Sunset Apartments",
        channel: "IN_APP",
        metadata: { requestId: request.id },
      },
      {
        organizationId: demoOrg.id,
        userId: demoUsers[1].id,
        title: "New Maintenance Request",
        message: "Request WR-0001 submitted for Sunset Apartments",
        channel: "IN_APP",
        metadata: { requestId: request.id },
      },
      {
        organizationId: demoOrg.id,
        userId: demoUsers[2].id,
        title: "Request Submitted",
        message: "Your maintenance request WR-0001 has been submitted",
        channel: "IN_APP",
        metadata: { requestId: request.id },
      },
      {
        organizationId: demoOrg.id,
        userId: contractorUser.id,
        title: "New Work Order Assigned",
        message: "You have been assigned to WO-0001 at Sunset Apartments",
        channel: "IN_APP",
        metadata: { workOrderId: "demo-wo-1" },
      },
    ],
  });

  console.log("Seeded development data");
}

async function main() {
  await seedSubscriptionPlans();
  await seedDevelopmentData();
  console.log("Database seeding completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
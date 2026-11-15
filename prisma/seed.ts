import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

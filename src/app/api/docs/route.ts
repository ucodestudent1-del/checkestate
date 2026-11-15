import { NextResponse } from "next/server";

export async function GET() {
  const openApiSpec = {
    openapi: "3.1.0",
    info: {
      title: "CheckEstate API",
      version: "1.0.0",
      description: "Property Maintenance Management SaaS API",
      contact: {
        name: "CheckEstate Support",
        email: "support@checkestate.app",
      },
      license: {
        name: "Proprietary",
      },
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || "http://localhost:3000",
        description: "Current environment",
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "next-auth.session-token",
          description: "NextAuth.js session cookie",
        },
        csrfToken: {
          type: "apiKey",
          in: "header",
          name: "x-csrf-token",
          description: "CSRF token for mutation requests",
        },
      },
      schemas: {
        Property: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            organizationId: { type: "string", format: "cuid" },
            name: { type: "string" },
            address: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zipCode: { type: "string" },
            propertyType: { type: "string" },
            description: { type: "string", nullable: true },
            photoUrls: { type: "array", items: { type: "string" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        Unit: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            organizationId: { type: "string", format: "cuid" },
            propertyId: { type: "string", format: "cuid" },
            unitNumber: { type: "string" },
            floor: { type: "integer", nullable: true },
            bedrooms: { type: "integer", nullable: true },
            bathrooms: { type: "integer", nullable: true },
            squareFeet: { type: "integer", nullable: true },
            status: { type: "string", enum: ["VACANT", "OCCUPIED", "MAINTENANCE"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        MaintenanceRequest: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            organizationId: { type: "string", format: "cuid" },
            requestNumber: { type: "string", pattern: "^WR-\\d{4}$" },
            propertyId: { type: "string", format: "cuid" },
            unitId: { type: "string", format: "cuid", nullable: true },
            tenantId: { type: "string", format: "cuid", nullable: true },
            submittedById: { type: "string", format: "cuid", nullable: true },
            title: { type: "string" },
            description: { type: "string" },
            category: { type: "string", enum: ["PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "PEST_CONTROL", "CLEANING", "LANDSCAPING", "PAINTING", "CARPENTRY", "ROOFING", "SECURITY", "OTHER"] },
            priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "URGENT", "EMERGENCY"] },
            status: { type: "string", enum: ["NEW", "UNDER_REVIEW", "AWAITING_APPROVAL", "APPROVED", "ASSIGNED", "SCHEDULED", "IN_PROGRESS", "WAITING_FOR_PARTS", "COMPLETED", "CLOSED", "CANCELLED"] },
            estimatedCost: { type: "number", format: "decimal", nullable: true },
            approvedCost: { type: "number", format: "decimal", nullable: true },
            actualCost: { type: "number", format: "decimal", nullable: true },
            appointmentDate: { type: "string", format: "date-time", nullable: true },
            completionDate: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        WorkOrder: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            organizationId: { type: "string", format: "cuid" },
            maintenanceRequestId: { type: "string", format: "cuid" },
            workOrderNumber: { type: "string", pattern: "^WO-\\d{4}$" },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            status: { type: "string", enum: ["NEW", "UNDER_REVIEW", "AWAITING_APPROVAL", "APPROVED", "ASSIGNED", "SCHEDULED", "IN_PROGRESS", "WAITING_FOR_PARTS", "COMPLETED", "CLOSED", "CANCELLED"] },
            assignedToId: { type: "string", format: "cuid", nullable: true },
            scheduledDate: { type: "string", format: "date-time", nullable: true },
            completedDate: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        Contractor: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            organizationId: { type: "string", format: "cuid" },
            name: { type: "string" },
            businessName: { type: "string", nullable: true },
            email: { type: "string", format: "email" },
            phone: { type: "string", nullable: true },
            address: { type: "string", nullable: true },
            tradeSpecialization: { type: "string", nullable: true },
            serviceAreas: { type: "string", nullable: true },
            insuranceInfo: { type: "string", nullable: true },
            licenseInfo: { type: "string", nullable: true },
            documentExpiryDate: { type: "string", format: "date-time", nullable: true },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        MaintenanceExpense: {
          type: "object",
          properties: {
            id: { type: "string", format: "cuid" },
            organizationId: { type: "string", format: "cuid" },
            propertyId: { type: "string", format: "cuid", nullable: true },
            unitId: { type: "string", format: "cuid", nullable: true },
            workOrderId: { type: "string", format: "cuid", nullable: true },
            contractorId: { type: "string", format: "cuid", nullable: true },
            title: { type: "string" },
            description: { type: "string", nullable: true },
            category: { type: "string", enum: ["PLUMBING", "ELECTRICAL", "HVAC", "APPLIANCE", "PEST_CONTROL", "CLEANING", "LANDSCAPING", "PAINTING", "CARPENTRY", "ROOFING", "SECURITY", "OTHER"] },
            estimatedCost: { type: "number", format: "decimal", nullable: true },
            approvedCost: { type: "number", format: "decimal", nullable: true },
            actualCost: { type: "number", format: "decimal" },
            invoiceNumber: { type: "string", nullable: true },
            receiptUrl: { type: "string", nullable: true },
            expenseDate: { type: "string", format: "date-time" },
            paidDate: { type: "string", format: "date-time", nullable: true },
            paymentStatus: { type: "string", enum: ["UNPAID", "PAID", "PARTIAL"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            deletedAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            issues: {
              type: "object",
              additionalProperties: { type: "array", items: { type: "string" } },
            },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: {} },
            total: { type: "integer" },
            page: { type: "integer" },
            pageSize: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
    },
    security: [
      { sessionAuth: [] },
    ],
    paths: {
      "/api/health": {
        get: {
          summary: "Health check endpoint",
          description: "Returns system health status with dependency checks",
          responses: {
            "200": { description: "System healthy", content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } } },
            "503": { description: "System unhealthy", content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } } },
          },
        },
      },
      "/api/properties": {
        get: {
          summary: "List properties",
          description: "Returns paginated list of properties for the authenticated organization",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", default: 10 } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "city", in: "query", schema: { type: "string" } },
            { name: "state", in: "query", schema: { type: "string" } },
            { name: "propertyType", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Properties list", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedResponse" } } } },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          summary: "Create property",
          description: "Creates a new property for the authenticated organization",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["name", "address", "city", "state", "zipCode", "propertyType"],
                  properties: {
                    name: { type: "string" },
                    address: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string" },
                    zipCode: { type: "string" },
                    propertyType: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
            },
          responses: {
            "201": { description: "Property created", content: { "application/json": { schema: { $ref: "#/components/schemas/Property" } } } },
            "400": { $ref: "#/components/responses/BadRequest" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/properties/{id}": {
        get: {
          summary: "Get property",
          description: "Returns a single property by ID",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Property found", content: { "application/json": { schema: { $ref: "#/components/schemas/Property" } } } },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        patch: {
          summary: "Update property",
          description: "Updates a property",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    address: { type: "string" },
                    city: { type: "string" },
                    state: { type: "string" },
                    zipCode: { type: "string" },
                    propertyType: { type: "string" },
                    description: { type: "string" },
                  },
                },
              },
            },
          responses: {
            "200": { description: "Property updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Property" } } } },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
        delete: {
          summary: "Delete property (soft delete)",
          description: "Marks a property as deleted",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Property deleted" },
            "400": { description: "Cannot delete property with units" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/api/units": {
        get: {
          summary: "List units",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", default: 10 } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "propertyId", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Units list", content: { "application/json": { schema: { $ref: "#/components/schemas/PaginatedResponse" } } } },
          },
        },
        post: {
          summary: "Create unit",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["propertyId", "unitNumber"],
                  properties: {
                    propertyId: { type: "string" },
                    unitNumber: { type: "string" },
                    floor: { type: "integer" },
                    bedrooms: { type: "integer" },
                    bathrooms: { type: "integer" },
                    squareFeet: { type: "integer" },
                    status: { type: "string", default: "VACANT" },
                  },
                },
              },
            },
          responses: {
            "201": { description: "Unit created", content: { "application/json": { schema: { $ref: "#/components/schemas/Unit" } } } },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/maintenance-requests": {
        get: {
          summary: "List maintenance requests (manager view)",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", default: 10 } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "priority", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "propertyId", in: "query", schema: { type: "string" } },
            { name: "category", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Maintenance requests list" },
          },
        },
        post: {
          summary: "Create maintenance request (tenant view)",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["propertyId", "title", "description", "category"],
                  properties: {
                    propertyId: { type: "string" },
                    unitId: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    priority: { type: "string", default: "MEDIUM" },
                  },
                },
              },
            },
          responses: {
            "201": { description: "Maintenance request created" },
            "400": { $ref: "#/components/responses/BadRequest" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/work-orders": {
        get: {
          summary: "List work orders",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", default: 10 } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Work orders list" },
          },
        },
        patch: {
          summary: "Update work order",
          parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string" },
                    assignedToId: { type: "string" },
                    scheduledDate: { type: "string", format: "date-time" },
                    completedDate: { type: "string", format: "date-time" },
                    description: { type: "string" },
                  },
                },
              },
            },
          responses: {
            "200": { description: "Work order updated" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": { $ref: "#/components/responses/NotFound" },
          },
        },
      },
      "/api/contractor/work-orders": {
        get: {
          summary: "List contractor's assigned work orders",
          security: [{ sessionAuth: [] }],
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", default: 10 } },
            { name: "status", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
          ],
          responses: {
            "200": { description: "Contractor work orders list" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        patch: {
          summary: "Update contractor work order status",
          parameters: [{ name: "id", in: "query", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["IN_PROGRESS", "WAITING_FOR_PARTS", "COMPLETED"] },
                    scheduledDate: { type: "string", format: "date-time" },
                    completedDate: { type: "string", format: "date-time" },
                  },
                },
              },
            },
          responses: {
            "200": { description: "Work order updated" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/expenses": {
        get: {
          summary: "List maintenance expenses",
          parameters: [
            { name: "page", in: "query", schema: { type: "integer", default: 1 } },
            { name: "pageSize", in: "query", schema: { type: "integer", default: 10 } },
          ],
          responses: {
            "200": { description: "Expenses list" },
          },
        },
        post: {
          summary: "Create maintenance expense",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["title", "category", "actualCost", "expenseDate"],
                  properties: {
                    propertyId: { type: "string" },
                    unitId: { type: "string" },
                    workOrderId: { type: "string" },
                    contractorId: { type: "string" },
                    title: { type: "string" },
                    description: { type: "string" },
                    category: { type: "string" },
                    estimatedCost: { type: "number" },
                    approvedCost: { type: "number" },
                    actualCost: { type: "number" },
                    invoiceNumber: { type: "string" },
                    receiptUrl: { type: "string" },
                    expenseDate: { type: "string", format: "date-time" },
                    paymentStatus: { type: "string", default: "UNPAID" },
                  },
                },
              },
            },
          responses: {
            "201": { description: "Expense created" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
      "/api/upload": {
        post: {
          summary: "Generate presigned upload URL",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["fileName", "fileType", "folder"],
                  properties: {
                    fileName: { type: "string" },
                    fileType: { type: "string", enum: ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] },
                    folder: { type: "string", enum: ["property-photos", "receipts", "contractor-docs"] },
                  },
                },
              },
            },
          responses: {
            "200": {
              description: "Upload URL generated",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      uploadUrl: { type: "string" },
                      fileUrl: { type: "string" },
                      key: { type: "string" },
                      expiresIn: { type: "integer" },
                      maxFileSize: { type: "integer" },
                    },
                  },
                },
              },
            },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
        delete: {
          summary: "Delete uploaded file",
          parameters: [{ name: "key", in: "query", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "File deletion queued" },
          },
        },
      },
      "/api/stripe/checkout": {
        post: {
          summary: "Create Stripe checkout session",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["planType", "billingCycle"],
                  properties: {
                    planType: { type: "string", enum: ["STARTER", "PROFESSIONAL", "BUSINESS", "AGENCY"] },
                    billingCycle: { type: "string", enum: ["monthly", "yearly"] },
                    successUrl: { type: "string" },
                    cancelUrl: { type: "string" },
                  },
                },
              },
            },
          responses: {
            "200": {
              description: "Checkout session created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      sessionId: { type: "string" },
                      url: { type: "string" },
                    },
                  },
                },
              },
            },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/stripe/portal": {
        get: {
          summary: "Create Stripe billing portal session",
          parameters: [{ name: "returnUrl", in: "query", schema: { type: "string" } }],
          responses: {
            "200": {
              description: "Portal session created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      url: { type: "string" },
                    },
                  },
                },
              },
            },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/auth/login": {
        post: {
          summary: "Login with credentials",
          description: "Authenticate user with email and password",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          responses: {
            "200": { description: "Login successful" },
            "401": { $ref: "#/components/responses/Unauthorized" },
          },
        },
      },
      "/api/auth/register": {
        post: {
          summary: "Register new user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password", "confirmPassword", "firstName", "lastName"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 },
                    confirmPassword: { type: "string" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                  },
                },
              },
            },
          responses: {
            "201": { description: "User registered" },
            "400": { $ref: "#/components/responses/BadRequest" },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: "Unauthorized",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      Forbidden: {
        description: "Forbidden",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      NotFound: {
        description: "Not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
      BadRequest: {
        description: "Bad request",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
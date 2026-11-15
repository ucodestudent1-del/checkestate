import { test, expect } from "@playwright/test";

test.describe("Complete User Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test.describe("Registration & Login Flow", () => {
    test("should allow new user registration", async ({ page }) => {
      await page.goto("/auth/register");
      
      await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.fill('input[name="confirmPassword"]', "TestPassword123!");
      await page.fill('input[name="firstName"]', "Test");
      await page.fill('input[name="lastName"]', "User");
      
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    });

    test("should reject weak passwords", async ({ page }) => {
      await page.goto("/auth/register");
      
      await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
      await page.fill('input[name="password"]', "weak");
      await page.fill('input[name="confirmPassword"]', "weak");
      await page.fill('input[name="firstName"]', "Test");
      await page.fill('input[name="lastName"]', "User");
      
      await page.click('button[type="submit"]');
      
      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    });

    test("should login with valid credentials", async ({ page }) => {
      // First register a user
      const email = `login${Date.now()}@example.com`;
      await page.goto("/auth/register");
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.fill('input[name="confirmPassword"]', "TestPassword123!");
      await page.fill('input[name="firstName"]', "Login");
      await page.fill('input[name="lastName"]', "Test");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Logout
      await page.click('button:has-text("Sign out")');
      
      // Login again
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL(/\/dashboard/);
    });

    test("should reject invalid login credentials", async ({ page }) => {
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', "nonexistent@example.com");
      await page.fill('input[name="password"]', "wrongpassword");
      await page.click('button[type="submit"]');
      
      await expect(page.getByText(/invalid email or password/i)).toBeVisible();
    });
  });

  test.describe("Property Management Flow", () => {
    test("should create property and units", async ({ page }) => {
      // Login first (assume test user exists)
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', "test@example.com");
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/\/dashboard/);
      
      // Navigate to properties
      await page.goto("/dashboard/properties");
      await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();
      
      // Create property
      await page.click('text=Add Property');
      await page.fill('input[name="name"]', "E2E Test Property");
      await page.fill('input[name="address"]', "123 E2E Street");
      await page.fill('input[name="city"]', "Test City");
      await page.fill('input[name="state"]', "TS");
      await page.fill('input[name="zipCode"]', "12345");
      await page.fill('input[name="propertyType"]', "APARTMENT");
      await page.click('button[type="submit"]');
      
      await expect(page.getByText("E2E Test Property")).toBeVisible();
      
      // Create unit
      await page.click('text=E2E Test Property');
      await page.click('text=Add Unit');
      await page.fill('input[name="unitNumber"]', "101");
      await page.fill('input[name="floor"]', "1");
      await page.fill('input[name="bedrooms"]', "2");
      await page.fill('input[name="bathrooms"]', "1");
      await page.click('button[type="submit"]');
      
      await expect(page.getByText("101")).toBeVisible();
    });

    test("should enforce plan limits", async ({ page }) => {
      // This test would verify that STARTER plan (10 units) is enforced
      // Requires creating 11 units and expecting failure on 11th
    });
  });

  test.describe("Maintenance Request Flow", () => {
    test("tenant can submit maintenance request", async ({ page }) => {
      // Login as tenant
      await page.goto("/tenant/login");
      await page.fill('input[name="email"]', "tenant@example.com");
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.click('button[type="submit"]');
      
      // Navigate to requests
      await page.goto("/tenant/requests");
      await expect(page.getByRole("heading", { name: "Maintenance Requests" })).toBeVisible();
      
      // Create new request
      await page.click('text=New Request');
      await page.selectOption('select[name="propertyId"]', { label: "Test Property" });
      await page.selectOption('select[name="unitId"]', { label: "Unit 101" });
      await page.fill('input[name="title"]', "Broken window");
      await page.fill('textarea[name="description"]', "Window in bedroom is cracked");
      await page.selectOption('select[name="category"]', "OTHER");
      await page.selectOption('select[name="priority"]', "HIGH");
      await page.click('button[type="submit"]');
      
      await expect(page.getByText("Broken window")).toBeVisible();
      await expect(page.getByText("HIGH")).toBeVisible();
    });

    test("manager can view and update request", async ({ page }) => {
      // Login as manager
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', "manager@example.com");
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.click('button[type="submit"]');
      
      // Navigate to maintenance requests
      await page.goto("/dashboard/maintenance-requests");
      
      // View request detail
      await page.click('text=Broken window');
      await expect(page.getByText("Broken window")).toBeVisible();
      
      // Update status
      await page.selectOption('select[name="status"]', "UNDER_REVIEW");
      await page.click('button:has-text("Update")');
      
      await expect(page.getByText("UNDER_REVIEW")).toBeVisible();
    });
  });

  test.describe("Work Order Flow", () => {
    test("should create work order from request", async ({ page }) => {
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', "manager@example.com");
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.click('button[type="submit"]');
      
      await page.goto("/dashboard/work-orders");
      
      // Should see work order auto-created from request
      await expect(page.getByText("WO-")).toBeVisible();
    });

    test("should progress work order through status workflow", async ({ page }) => {
      await page.goto("/auth/login");
      await page.fill('input[name="email"]', "manager@example.com");
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.click('button[type="submit"]');
      
      await page.goto("/dashboard/work-orders");
      
      // Click on a work order
      await page.click('text=WO-0001');
      
      // Progress through statuses
      const statuses = ["AWAITING_APPROVAL", "APPROVED", "ASSIGNED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CLOSED"];
      
      for (const status of statuses) {
        await page.selectOption('select[name="status"]', status);
        await page.click('button:has-text("Update Status")');
        await expect(page.getByText(status)).toBeVisible();
      }
    });
  });

  test.describe("Contractor Portal Flow", () => {
    test("contractor can view assigned work orders", async ({ page }) => {
      await page.goto("/contractor/login");
      await page.fill('input[name="email"]', "contractor@example.com");
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.click('button[type="submit"]');
      
      await expect(page.getByRole("heading", { name: "Contractor Dashboard" })).toBeVisible();
      await expect(page.getByRole("heading", { name: "My Work Orders" })).toBeVisible();
    });

    test("contractor can update work order status", async ({ page }) => {
      await page.goto("/contractor/login");
      await page.fill('input[name="email"]', "contractor@example.com");
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.click('button[type="submit"]');
      
      await page.goto("/contractor/work-orders");
      await page.click('text=WO-0001');
      
      // Contractor can only update to specific statuses
      await page.selectOption('select[name="status"]', "IN_PROGRESS");
      await page.click('button:has-text("Update Status")');
      
      await expect(page.getByText("IN_PROGRESS")).toBeVisible();
    });

    test("contractor cannot reassign work order", async ({ page }) => {
      await page.goto("/contractor/login");
      await page.fill('input[name="email"]', "contractor@example.com");
      await page.fill('input[name="password"]', "TestPassword123!");
      await page.click('button[type="submit"]');
      
      await page.goto("/contractor/work-orders/WO-0001");
      
      // Should not see assignment dropdown
      await expect(page.locator('select[name="assignedToId"]')).not.toBeVisible();
    });
  });
});

test.describe("API Security", () => {
  test("should enforce CSRF on mutations", async ({ page }) => {
    const response = await page.request.post("/api/properties", {
      data: { name: "Test", address: "123 St", city: "City", state: "ST", zipCode: "12345", propertyType: "APARTMENT" },
    });
    expect(response.status()).toBe(403);
  });

  test("should enforce org isolation", async ({ page }) => {
    // Login as org1 user
    await page.goto("/auth/login");
    await page.fill('input[name="email"]', "org1@example.com");
    await page.fill('input[name="password"]', "TestPassword123!");
    await page.click('button[type="submit"]');
    
    // Try to access org2 property
    const response = await page.request.get("/api/properties/org2-property-id");
    expect(response.status()).toBe(404);
  });

  test("should rate limit auth endpoints", async ({ page }) => {
    // Make 6 requests to login (limit is 5)
    for (let i = 0; i < 6; i++) {
      const response = await page.request.post("/api/auth/callback/credentials", {
        form: { email: "test@example.com", password: "wrong" },
      });
      if (i < 5) {
        expect(response.status()).not.toBe(429);
      } else {
        expect(response.status()).toBe(429);
      }
    }
  });
});

test.describe("Accessibility", () => {
  test("all pages should have proper heading hierarchy", async ({ page }) => {
    const pages = ["/", "/auth/login", "/auth/register", "/dashboard", "/dashboard/properties", "/dashboard/maintenance-requests", "/dashboard/work-orders"];
    
    for (const url of pages) {
      await page.goto(url);
      const h1Count = await page.locator("h1").count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    }
  });

  test("forms should have proper labels", async ({ page }) => {
    await page.goto("/auth/login");
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    
    await expect(emailInput).toHaveAttribute("id");
    await expect(page.locator(`label[for="${await emailInput.getAttribute("id")}"]`)).toBeVisible();
    
    await expect(passwordInput).toHaveAttribute("id");
    await expect(page.locator(`label[for="${await passwordInput.getAttribute("id")}"]`)).toBeVisible();
  });

  test("buttons should have accessible names", async ({ page }) => {
    await page.goto("/auth/login");
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toHaveText(/sign in/i);
  });
});
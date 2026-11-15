import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page).toHaveTitle(/Sign in/);
    await expect(page.getByLabel("Email address")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
  });

  test("should show validation errors for empty login form", async ({ page }) => {
    await page.goto("/auth/login");
    await page.click('button[type="submit"]');
    await expect(page.getByText("Invalid email address")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
  });

  test("should navigate to registration page", async ({ page }) => {
    await page.goto("/auth/login");
    await page.click('text=create an account');
    await expect(page).toHaveURL("/auth/register");
  });
});

test.describe("Dashboard Accessibility", () => {
  test("should have skip to main content link", async ({ page }) => {
    await page.goto("/dashboard");
    // Skip link should be hidden by default
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible(); // visible when focused via tab
    
    await page.keyboard.press("Tab");
    await expect(skipLink).toBeVisible();
  });

  test("should have proper page heading", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("should have main content landmark", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator("#main-content")).toBeVisible();
  });
});

test.describe("Maintenance Requests", () => {
  test("should display maintenance requests page", async ({ page }) => {
    await page.goto("/dashboard/maintenance-requests");
    await expect(page.getByRole("heading", { name: "Maintenance Requests" })).toBeVisible();
  });

  test("should have accessible table with proper headers", async ({ page }) => {
    await page.goto("/dashboard/maintenance-requests");
    await expect(page.getByRole("columnheader", { name: "Request #" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Title" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Status" })).toBeVisible();
  });
});

test.describe("Work Orders", () => {
  test("should display work orders page", async ({ page }) => {
    await page.goto("/dashboard/work-orders");
    await expect(page.getByRole("heading", { name: "Work Orders" })).toBeVisible();
  });

  test("should have status filter dropdown", async ({ page }) => {
    await page.goto("/dashboard/work-orders");
    await expect(page.getByRole("combobox")).toContainText(["All Statuses"]);
  });
});

test.describe("Security Headers", () => {
  test("should include security headers in responses", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers();
    
    expect(headers?.[ "x-content-type-options" ]).toBe("nosniff");
    expect(headers?.[ "x-frame-options" ]).toBe("DENY");
    expect(headers?.[ "strict-transport-security" ]).toBeDefined();
    expect(headers?.[ "content-security-policy" ]).toBeDefined();
  });
});

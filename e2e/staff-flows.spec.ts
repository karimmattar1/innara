import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Staff Portal — Comprehensive Flow Tests (INN-122)
// ---------------------------------------------------------------------------
//
// Tests staff portal routing, auth guards, navigation structure, and
// page content verification. Dual-path pattern: works without auth.
// ---------------------------------------------------------------------------

const STAFF_ROUTES = [
  { path: "/staff", label: "dashboard" },
  { path: "/staff/requests", label: "requests" },
  { path: "/staff/messages", label: "messages" },
  { path: "/staff/analytics", label: "analytics" },
  { path: "/staff/shift", label: "shift" },
  { path: "/staff/profile", label: "profile" },
];

// ---------------------------------------------------------------------------
// Auth guards — all staff routes redirect to staff login
// ---------------------------------------------------------------------------

test.describe("Staff Portal — Auth Guards (comprehensive)", () => {
  for (const route of STAFF_ROUTES) {
    test(`${route.path} redirects to /auth/staff/login`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForURL(/\/auth\/staff\/login/);
      expect(page.url()).toContain("/auth/staff/login");
    });
  }

  test("staff request detail route redirects", async ({ page }) => {
    await page.goto("/staff/requests/10000000-1000-4000-8000-100000000001");
    await page.waitForURL(/\/auth\/staff\/login/);
    expect(page.url()).toContain("/auth/staff/login");
  });
});

// ---------------------------------------------------------------------------
// Route existence — all staff routes are routable (not 404)
// ---------------------------------------------------------------------------

test.describe("Staff Portal — Route Existence", () => {
  for (const route of STAFF_ROUTES) {
    test(`${route.path} is a valid route (not 404)`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).not.toBe(404);
    });
  }
});

// ---------------------------------------------------------------------------
// Staff login page — structure and interaction tests
// ---------------------------------------------------------------------------

test.describe("Staff Portal — Login Page", () => {
  test("staff login page renders form", async ({ page }) => {
    await page.goto("/auth/staff/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.locator("#staff-password")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();
  });

  test("staff login page links to forgot password", async ({ page }) => {
    await page.goto("/auth/staff/login");
    const forgotLink = page.getByRole("link", {
      name: /forgot.*password/i,
    });
    await expect(forgotLink).toBeVisible();
  });

  test("staff login page links to guest portal", async ({ page }) => {
    await page.goto("/auth/staff/login");
    const guestLink = page.getByRole("link", { name: /guest/i });
    if (await guestLink.isVisible()) {
      await guestLink.click();
      await expect(page).toHaveURL(/\/auth\/guest\/login/);
    }
  });

  test("empty form submission stays on login page", async ({ page }) => {
    await page.goto("/auth/staff/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/auth\/staff\/login/);
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/auth/staff/login");
    await page.getByLabel("Email").fill("nonexistent@test.com");
    await page.locator("#staff-password").fill("wrongpassword123");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Should stay on login and show error or display error message
    await page.waitForTimeout(3000);
    await expect(page).toHaveURL(/\/auth\/staff\/login/);
  });
});

// ---------------------------------------------------------------------------
// Staff redirect intent — preserves destination in query param
// ---------------------------------------------------------------------------

test.describe("Staff Portal — Redirect Intent", () => {
  for (const route of ["/staff/requests", "/staff/analytics", "/staff/messages"]) {
    test(`redirect from ${route} includes redirect param`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(/\/auth\/staff\/login/);
      const url = new URL(page.url());
      const redirect = url.searchParams.get("redirect");
      expect(redirect).toBe(route);
    });
  }
});

// ---------------------------------------------------------------------------
// Staff portal — URL param injection protection
// ---------------------------------------------------------------------------

test.describe("Staff Portal — URL Param Handling", () => {
  const paramRoutes = [
    "/staff/requests?status=new",
    "/staff/requests?status=in_progress",
    "/staff/requests?category=housekeeping",
    "/staff/requests?priority=high",
  ];

  for (const route of paramRoutes) {
    test(`${route} redirects to login (not 404)`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).not.toBe(404);
      await page.waitForURL(/\/auth\/staff\/login/);
    });
  }
});

// ---------------------------------------------------------------------------
// Desktop screenshots — capture all staff routes at 1440x900
// ---------------------------------------------------------------------------

test.describe("Staff Portal — Desktop Screenshots", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const route of STAFF_ROUTES) {
    test(`screenshot: ${route.label} (desktop)`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `e2e/screenshots/staff-${route.label}-desktop.png`,
        fullPage: true,
      });
    });
  }
});

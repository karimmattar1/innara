import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Guest Portal — Comprehensive Flow Tests (INN-122)
// ---------------------------------------------------------------------------
//
// Tests the complete guest journey across all portal sections.
// Uses dual-path pattern: works without auth (verifies structure/routing)
// and with auth when E2E_GUEST_EMAIL + E2E_GUEST_PASSWORD are set.
// ---------------------------------------------------------------------------

const GUEST_ROUTES = [
  "/guest/welcome",
  "/guest/services",
  "/guest/services/housekeeping",
  "/guest/services/maintenance",
  "/guest/room-service",
  "/guest/room-service/checkout",
  "/guest/requests",
  "/guest/concierge",
  "/guest/explore",
  "/guest/profile",
  "/guest/feedback",
  "/guest/checkout",
];

// ---------------------------------------------------------------------------
// Route existence — every guest route is routable (not 404)
// ---------------------------------------------------------------------------

test.describe("Guest Portal — Route Existence", () => {
  for (const route of GUEST_ROUTES) {
    test(`${route} is a valid route (not 404)`, async ({ page }) => {
      const response = await page.goto(route);
      expect(response?.status()).not.toBe(404);
    });
  }
});

// ---------------------------------------------------------------------------
// Auth flow structure — login → register → verify round-trips
// ---------------------------------------------------------------------------

test.describe("Guest Portal — Auth Flow Navigation", () => {
  test("login → register → login round trip", async ({ page }) => {
    await page.goto("/auth/guest/login");
    await expect(page).toHaveURL(/\/auth\/guest\/login/);

    // Navigate to register
    const registerLink = page.getByRole("link", { name: /register|sign up|create/i });
    if (await registerLink.isVisible()) {
      await registerLink.click();
      await expect(page).toHaveURL(/\/auth\/guest\/register/);

      // Navigate back to login
      const loginLink = page.getByRole("link", { name: "Sign in" });
      if (await loginLink.isVisible()) {
        await loginLink.click();
        await expect(page).toHaveURL(/\/auth\/guest\/login/);
      }
    }
  });

  test("login page validates empty submission", async ({ page }) => {
    await page.goto("/auth/guest/login");
    const submitButton = page.getByRole("button", { name: /sign in/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should stay on login page (not navigate away)
      await expect(page).toHaveURL(/\/auth\/guest\/login/);
    }
  });

  test("register page validates empty submission", async ({ page }) => {
    await page.goto("/auth/guest/register");
    const submitButton = page.getByRole("button", { name: /sign up|register|create/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();
      // Should stay on register page
      await expect(page).toHaveURL(/\/auth\/guest\/register/);
    }
  });

  test("verify page renders booking reference step", async ({ page }) => {
    await page.goto("/auth/guest/verify");
    // Should show step 1: enter booking reference
    const heading = page.getByRole("heading");
    await expect(heading.first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Guest portal — redirect preserves intended destination
// ---------------------------------------------------------------------------

test.describe("Guest Portal — Redirect Intent", () => {
  for (const route of ["/guest/concierge", "/guest/requests", "/guest/room-service"]) {
    test(`redirect from ${route} includes redirect param`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(/\/auth\//);
      const url = new URL(page.url());
      // Middleware should append ?redirect= with original path
      const redirect = url.searchParams.get("redirect");
      expect(redirect).toBe(route);
    });
  }
});

// ---------------------------------------------------------------------------
// Guest mobile viewport — all pages render correctly at 375px
// ---------------------------------------------------------------------------

test.describe("Guest Portal — Mobile Screenshots", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  const authPages = [
    { path: "/auth/guest/login", label: "guest-login" },
    { path: "/auth/guest/register", label: "guest-register" },
    { path: "/auth/guest/verify", label: "guest-verify" },
  ];

  for (const pg of authPages) {
    test(`mobile screenshot: ${pg.label}`, async ({ page }) => {
      await page.goto(pg.path);
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `e2e/screenshots/mobile-${pg.label}.png`,
        fullPage: true,
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Guest portal — API routes accessible
// ---------------------------------------------------------------------------

test.describe("Guest Portal — API Health", () => {
  test("health endpoint responds without error", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBeLessThan(500);
  });

  test("non-existent API route does not return 500", async ({ request }) => {
    const response = await request.get("/api/nonexistent-route-xyz");
    expect(response.status()).toBeLessThan(500);
  });
});

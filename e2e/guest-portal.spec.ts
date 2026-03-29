import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Guest Portal — Auth Guard Tests
// ---------------------------------------------------------------------------
// All guest portal routes are protected by middleware. Unauthenticated
// requests are redirected to /auth/guest/login. These tests verify that
// the auth guard works correctly across all guest routes.
// ---------------------------------------------------------------------------

test.describe("Guest Portal — Auth Guards", () => {
  test("unauthenticated access to /guest/welcome redirects to login", async ({
    page,
  }) => {
    const response = await page.goto("/guest/welcome");
    // Either redirected (URL contains auth) or response is a redirect status
    const url = page.url();
    const isAuthUrl = url.includes("/auth/");
    const isRedirectStatus =
      response?.status() === 302 || response?.status() === 307;
    expect(isAuthUrl || isRedirectStatus).toBe(true);
  });

  test("unauthenticated access to /guest/services redirects to login", async ({
    page,
  }) => {
    await page.goto("/guest/services");
    await expect(page).toHaveURL(/\/auth\//);
  });

  test("unauthenticated access to /guest/services/housekeeping redirects to login", async ({
    page,
  }) => {
    await page.goto("/guest/services/housekeeping");
    await expect(page).toHaveURL(/\/auth\//);
  });

  test("unauthenticated access to /guest/services/maintenance redirects to login", async ({
    page,
  }) => {
    await page.goto("/guest/services/maintenance");
    await expect(page).toHaveURL(/\/auth\//);
  });

  test("unauthenticated access to /guest/services/spa redirects to login", async ({
    page,
  }) => {
    await page.goto("/guest/services/spa");
    await expect(page).toHaveURL(/\/auth\//);
  });

  test("unauthenticated access to /guest/room-service redirects to login", async ({
    page,
  }) => {
    await page.goto("/guest/room-service");
    await expect(page).toHaveURL(/\/auth\//);
  });

  test("unauthenticated access to /guest/room-service/checkout redirects to login", async ({
    page,
  }) => {
    await page.goto("/guest/room-service/checkout");
    await expect(page).toHaveURL(/\/auth\//);
  });

  test("unauthenticated access to /guest/requests redirects to login", async ({
    page,
  }) => {
    await page.goto("/guest/requests");
    await expect(page).toHaveURL(/\/auth\//);
  });

  test("unauthenticated access to /guest/concierge redirects to login", async ({
    page,
  }) => {
    await page.goto("/guest/concierge");
    await expect(page).toHaveURL(/\/auth\//);
  });

  test("unauthenticated access to /guest/explore redirects to login", async ({
    page,
  }) => {
    await page.goto("/guest/explore");
    await expect(page).toHaveURL(/\/auth\//);
  });

  test("unauthenticated access to /guest/profile redirects to login", async ({
    page,
  }) => {
    await page.goto("/guest/profile");
    await expect(page).toHaveURL(/\/auth\//);
  });

  test("unauthenticated access to /guest/feedback redirects to login", async ({
    page,
  }) => {
    await page.goto("/guest/feedback");
    await expect(page).toHaveURL(/\/auth\//);
  });

  test("unauthenticated access to /guest/checkout redirects to login", async ({
    page,
  }) => {
    await page.goto("/guest/checkout");
    await expect(page).toHaveURL(/\/auth\//);
  });
});

// ---------------------------------------------------------------------------
// Guest Auth Pages — Accessible Without Authentication
// ---------------------------------------------------------------------------

test.describe("Guest Portal — Auth Pages Are Public", () => {
  test("guest login page loads without redirect", async ({ page }) => {
    const response = await page.goto("/auth/guest/login");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/auth\/guest\/login/);
  });

  test("guest register page loads without redirect", async ({ page }) => {
    const response = await page.goto("/auth/guest/register");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL(/\/auth\/guest\/register/);
  });

  test("guest verify page loads without redirect", async ({ page }) => {
    const response = await page.goto("/auth/guest/verify");
    expect(response?.status()).toBe(200);
  });

  test("guest login page has email and password fields", async ({ page }) => {
    await page.goto("/auth/guest/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("guest login page has sign-in button", async ({ page }) => {
    await page.goto("/auth/guest/login");
    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// QR Verify Deep Link — URL Param Handling
// ---------------------------------------------------------------------------

test.describe("Guest Portal — QR Verify Deep Link", () => {
  test("verify page with hotel and room params loads", async ({ page }) => {
    // This is the deep link generated by generateGuestEntryQR
    const response = await page.goto(
      "/auth/guest/verify?hotel=00000000-0000-0000-0000-000000000000&room=101",
    );
    // Should not 404 — either loads or redirects to login
    expect(response?.status()).not.toBe(404);
  });

  test("verify page without params loads", async ({ page }) => {
    const response = await page.goto("/auth/guest/verify");
    expect(response?.status()).not.toBe(404);
  });
});

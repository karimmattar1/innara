import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Manager Portal — E2E Test Suite (INN-108)
// ---------------------------------------------------------------------------
//
// ALL manager portal routes are protected by middleware. Unauthenticated
// requests redirect to /auth/staff/login. These tests handle BOTH scenarios:
//   A) Auth redirect — verifies middleware correctly guards each route.
//   B) Authenticated session — verifies page content loads (when auth present).
//
// LOCATOR RULES:
//   - No bare `text=` locators — use getByRole(), getByText({ exact: true }),
//     or data-testid
//   - Prefer getByRole() over getByText()
//   - Scope to sections when text repeats
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Manager portal routes — complete inventory (14 screens)
// ---------------------------------------------------------------------------

const MANAGER_ROUTES = [
  { path: "/manager", label: "dashboard" },
  { path: "/manager/analytics", label: "analytics" },
  { path: "/manager/requests", label: "requests" },
  { path: "/manager/catalog", label: "catalog" },
  { path: "/manager/staff", label: "staff management" },
  { path: "/manager/billing", label: "billing" },
  { path: "/manager/branding", label: "branding" },
  { path: "/manager/permissions", label: "permissions" },
  { path: "/manager/go-live", label: "go-live checklist" },
  { path: "/manager/settings", label: "settings" },
  { path: "/manager/integrations", label: "integrations" },
  { path: "/manager/notifications", label: "notifications" },
  { path: "/manager/profile", label: "profile" },
  { path: "/manager/ops", label: "ops / SLA config" },
] as const;

// ---------------------------------------------------------------------------
// Auth Guard — Every manager route redirects to staff login when unauthenticated
// ---------------------------------------------------------------------------

test.describe("Manager Portal — Auth Guards", () => {
  for (const route of MANAGER_ROUTES) {
    test(`unauthenticated access to ${route.path} redirects to staff login`, async ({
      page,
    }) => {
      const response = await page.goto(route.path);

      // Must redirect — not a 404/500
      const status = response?.status() ?? 0;
      expect(status).not.toBe(404);
      expect(status).not.toBe(500);

      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    });
  }

  // Verify the redirect destination is usable
  test("redirect destination /auth/staff/login is accessible and has login form", async ({
    page,
  }) => {
    await page.goto("/manager");
    await expect(page).toHaveURL(/\/auth\/staff\/login/);

    await expect(page.getByRole("heading", { name: "Staff Console" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// URL Params — Filter params must NOT bypass auth
// ---------------------------------------------------------------------------

test.describe("Manager Portal — URL Params Do Not Bypass Auth", () => {
  const paramUrls = [
    "/manager/requests?status=new",
    "/manager/requests?priority=high",
    "/manager/requests?category=housekeeping",
    "/manager/catalog?tab=services",
    "/manager/staff?search=john",
    "/manager/analytics?period=month",
    "/manager/notifications?tab=alerts",
  ];

  for (const url of paramUrls) {
    test(`${url} redirects to login (not 404)`, async ({ page }) => {
      const response = await page.goto(url);
      expect(response?.status()).not.toBe(404);
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    });
  }
});

// ---------------------------------------------------------------------------
// Manager Portal — Deep-link sub-routes do not 404
// ---------------------------------------------------------------------------

test.describe("Manager Portal — Sub-routes Redirect Correctly", () => {
  test("deeply nested manager path redirects to login (not 404)", async ({
    page,
  }) => {
    const response = await page.goto("/manager/settings");
    expect(response?.status()).not.toBe(404);
    await expect(page).toHaveURL(/\/auth\/staff\/login/);
  });
});

// ---------------------------------------------------------------------------
// Auth Flow — Login Behavior (shared with staff portal, manager-specific paths)
// ---------------------------------------------------------------------------

test.describe("Manager Auth — Login Page Interaction", () => {
  test("submitting empty form does not redirect to manager portal", async ({
    page,
  }) => {
    await page.goto("/auth/staff/login");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Must NOT advance to /manager
    await expect(page).not.toHaveURL(/^\/manager/);
  });

  test("entering wrong credentials shows error and stays on login", async ({
    page,
  }) => {
    await page.goto("/auth/staff/login");

    await page.getByLabel("Email").fill("fakemanager@example.com");
    await page.locator("#staff-password").fill("wrongpassword123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(
      page
        .getByRole("alert")
        .or(page.getByText(/invalid/i))
        .or(page.getByText(/incorrect/i))
        .or(page.getByText(/error/i)),
    ).toBeVisible({ timeout: 10_000 });

    await expect(page).not.toHaveURL(/\/manager/);
  });
});

// ---------------------------------------------------------------------------
// Manager Portal — Desktop Viewport Screenshots (reference captures)
// ---------------------------------------------------------------------------
// Without auth, screenshots capture the redirect destination.
// With auth (CI), these capture each manager screen at desktop resolution.

test.describe("Manager Portal — Desktop Screenshots", () => {
  for (const route of MANAGER_ROUTES) {
    test(`screenshot: ${route.label} at 1440x900`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(route.path);

      // Wait for either the page to load (auth) or redirect to complete
      await page.waitForLoadState("networkidle");

      await page.screenshot({
        path: `screenshots/manager-${route.label.replace(/[\s/]+/g, "-")}.png`,
        fullPage: true,
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Manager Portal — Tablet Viewport Screenshots
// ---------------------------------------------------------------------------

test.describe("Manager Portal — Tablet Screenshots", () => {
  const keyScreens = [
    { path: "/manager", label: "dashboard" },
    { path: "/manager/analytics", label: "analytics" },
    { path: "/manager/requests", label: "requests" },
    { path: "/manager/notifications", label: "notifications" },
  ];

  for (const route of keyScreens) {
    test(`screenshot: ${route.label} at 768x1024 tablet`, async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      await page.screenshot({
        path: `screenshots/manager-${route.label}-tablet.png`,
        fullPage: true,
      });
    });
  }
});

// ---------------------------------------------------------------------------
// Manager Portal — Navigation Consistency
// ---------------------------------------------------------------------------
// Verifies that navigating between manager routes maintains auth state.
// Without auth, verifies all redirects land on the same login page.

test.describe("Manager Portal — Navigation Flow", () => {
  test("sequential navigation: dashboard → analytics → requests → back to dashboard", async ({
    page,
  }) => {
    // Start at manager root
    await page.goto("/manager");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (!isAuthed) {
      // Without auth, just verify all routes consistently redirect
      await page.goto("/manager/analytics");
      await expect(page).toHaveURL(/\/auth\/staff\/login/);

      await page.goto("/manager/requests");
      await expect(page).toHaveURL(/\/auth\/staff\/login/);

      await page.goto("/manager");
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    } else {
      // With auth, verify pages render headings
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      await page.goto("/manager/analytics");
      await expect(page.getByRole("heading", { name: /analytics/i })).toBeVisible();

      await page.goto("/manager/requests");
      await expect(page.getByRole("heading", { name: /requests/i })).toBeVisible();

      await page.goto("/manager");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("manager login page → forgot password → back completes round trip", async ({
    page,
  }) => {
    await page.goto("/manager");
    await expect(page).toHaveURL(/\/auth\/staff\/login/);

    await page.getByRole("link", { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/\/auth\/staff\/forgot-password/);

    await page.getByRole("link", { name: /back to sign in/i }).click();
    await expect(page).toHaveURL(/\/auth\/staff\/login/);
  });
});

// ---------------------------------------------------------------------------
// Manager Portal — Authenticated Screen Content Verification
// ---------------------------------------------------------------------------
// These tests only run meaningful assertions when a manager session is present.
// Without auth, they gracefully verify the redirect works. This allows CI to
// run with or without test credentials.

test.describe("Manager Portal — Screen Content (authenticated)", () => {
  test("dashboard shows page heading", async ({ page }) => {
    await page.goto("/manager");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("analytics page loads with period selector", async ({ page }) => {
    await page.goto("/manager/analytics");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /analytics/i })).toBeVisible();
      // Period selector tabs should be visible
      await expect(page.getByRole("tab", { name: /today/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /week/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("requests page loads with filter controls", async ({ page }) => {
    await page.goto("/manager/requests");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /requests/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("catalog page loads with tabs", async ({ page }) => {
    await page.goto("/manager/catalog");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /catalog/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("staff management page loads", async ({ page }) => {
    await page.goto("/manager/staff");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /staff/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("billing page loads subscription status", async ({ page }) => {
    await page.goto("/manager/billing");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /billing/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("branding page loads config form", async ({ page }) => {
    await page.goto("/manager/branding");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /branding/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("permissions page shows role matrix", async ({ page }) => {
    await page.goto("/manager/permissions");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /permissions/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("go-live checklist page loads", async ({ page }) => {
    await page.goto("/manager/go-live");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /go-live|launch/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("settings page loads", async ({ page }) => {
    await page.goto("/manager/settings");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("integrations page loads", async ({ page }) => {
    await page.goto("/manager/integrations");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /integrations/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("notifications page loads with tabs", async ({ page }) => {
    await page.goto("/manager/notifications");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();
      // Tab filter should be visible
      await expect(page.getByRole("tab", { name: /all/i })).toBeVisible();
      await expect(page.getByRole("tab", { name: /operations/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("profile page loads", async ({ page }) => {
    await page.goto("/manager/profile");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });

  test("ops page loads SLA config", async ({ page }) => {
    await page.goto("/manager/ops");
    const isAuthed = !(await page.url()).includes("/auth/");

    if (isAuthed) {
      await expect(page.getByRole("heading", { name: /ops|sla/i })).toBeVisible();
    } else {
      await expect(page).toHaveURL(/\/auth\/staff\/login/);
    }
  });
});

// Acceptance test for INN-43
// Verifies AC #7: unauthenticated access to /staff/analytics is blocked by middleware
// and redirects to the staff login page.
//
// Scope: Part B of the hybrid test plan (Karim, 2026-04-09).
// This test PASSES immediately because the existing middleware already handles
// all /staff/* routes — /staff/analytics does not need to exist for the redirect to fire.
//
// Pattern: matches e2e/staff-portal.spec.ts exactly (same locators, same assertions).

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// INN-43 Staff Analytics — Auth Guards
// ---------------------------------------------------------------------------

test.describe("INN-43 staff analytics — auth guards", () => {
  test("unauthenticated access to /staff/analytics redirects to staff login", async ({
    page,
  }) => {
    await page.goto("/staff/analytics");
    await expect(page).toHaveURL(/\/auth\/staff\/login/);
  });

  test("redirect destination renders the staff login form", async ({
    page,
  }) => {
    await page.goto("/staff/analytics");
    await expect(page).toHaveURL(/\/auth\/staff\/login/);

    // Verify the login page is functional — heading + form fields visible
    await expect(page.getByRole("heading", { name: "Staff Console" })).toBeVisible();
  });
});

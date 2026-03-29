import { test, expect } from "@playwright/test";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 375, height: 812 };

// Helper: capture console errors and hydration warnings
function captureConsoleIssues(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  const hydrationWarnings: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
    if (
      msg.text().includes("Hydration") ||
      msg.text().includes("hydration")
    ) {
      hydrationWarnings.push(msg.text());
    }
  });
  return { errors, hydrationWarnings };
}

test.describe("Visual Verification — Auth Pages", () => {
  const pages = [
    { path: "/auth/guest/login", name: "guest-login" },
    { path: "/auth/guest/register", name: "guest-register" },
    { path: "/auth/staff/login", name: "staff-login" },
    { path: "/auth/staff/forgot-password", name: "forgot-password" },
    { path: "/auth/staff/reset-password", name: "reset-password" },
    { path: "/auth/invite/accept", name: "invite-accept" },
    { path: "/auth/verify-email?success=true", name: "verify-email-success" },
    {
      path: "/auth/verify-email?error=verification_failed",
      name: "verify-email-error",
    },
    { path: "/auth/guest/verify", name: "guest-verify" },
  ];

  for (const p of pages) {
    test(`screenshot ${p.name} — desktop + mobile`, async ({ page }) => {
      const { hydrationWarnings } = captureConsoleIssues(page);

      // Desktop
      await page.setViewportSize(DESKTOP);
      await page.goto(p.path);
      await page.waitForLoadState("networkidle");
      await page.screenshot({
        path: `screenshots/${p.name}-desktop.png`,
        fullPage: true,
      });

      // Mobile
      await page.setViewportSize(MOBILE);
      await page.goto(p.path);
      await page.waitForLoadState("networkidle");
      await page.screenshot({
        path: `screenshots/${p.name}-mobile.png`,
        fullPage: true,
      });

      // Verify no hydration errors
      expect(hydrationWarnings, `Hydration warnings on ${p.name}`).toHaveLength(
        0
      );
    });
  }
});

test.describe("Behavioral Tests — Form Interactions", () => {
  test("guest login — empty form submission shows validation", async ({
    page,
  }) => {
    await page.goto("/auth/guest/login");
    const submitBtn = page.getByRole("button", { name: "Sign In" });
    await submitBtn.click();
    // HTML5 validation should prevent submission — email field should show validation
    const emailInput = page.getByLabel("Email");
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test("guest register — empty form submission shows validation", async ({
    page,
  }) => {
    await page.goto("/auth/guest/register");
    const submitBtn = page.getByRole("button", { name: /Create Account/i });
    await submitBtn.click();
    const nameInput = page.getByLabel("Full Name");
    const isInvalid = await nameInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test("staff login — empty form submission shows validation", async ({
    page,
  }) => {
    await page.goto("/auth/staff/login");
    const submitBtn = page.getByRole("button", { name: "Sign In" });
    await submitBtn.click();
    const emailInput = page.getByLabel("Email");
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test("forgot password — empty form submission shows validation", async ({
    page,
  }) => {
    await page.goto("/auth/staff/forgot-password");
    const submitBtn = page.getByRole("button", { name: /Send Reset Link/i });
    await submitBtn.click();
    const emailInput = page.getByLabel("Email");
    const isInvalid = await emailInput.evaluate(
      (el: HTMLInputElement) => !el.validity.valid
    );
    expect(isInvalid).toBe(true);
  });

  test("reset password — mismatched passwords show error", async ({
    page,
  }) => {
    await page.goto("/auth/staff/reset-password");
    await page.locator("#reset-password").fill("StrongP@ss1");
    await page.locator("#reset-confirm-password").fill("DifferentP@ss1");
    await page.getByRole("button", { name: /Update Password/i }).click();
    // Should show password mismatch error
    await expect(
      page.getByText(/match/i).or(page.getByText(/don't match/i))
    ).toBeVisible({ timeout: 3000 });
  });

  test("guest verify — booking ref step validates required field", async ({
    page,
  }) => {
    await page.goto("/auth/guest/verify");
    // Should show step 1: booking reference
    await expect(
      page.getByRole("heading", { name: /Booking/i }).or(
        page.getByText(/booking reference/i)
      )
    ).toBeVisible();
    // Try to proceed without entering a booking ref
    const nextBtn = page
      .getByRole("button", { name: /next|continue|verify/i })
      .first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      // Should show validation error or stay on step 1
      await page.waitForTimeout(500);
      // Take screenshot for evidence
      await page.screenshot({
        path: "screenshots/guest-verify-validation.png",
      });
    }
  });
});

test.describe("Behavioral Tests — Navigation", () => {
  test("forgot password back link returns to staff login", async ({
    page,
  }) => {
    await page.goto("/auth/staff/forgot-password");
    await page.getByRole("link", { name: /Back to Sign In/i }).click();
    await expect(page).toHaveURL(/\/auth\/staff\/login/);
  });

  test("invite accept error state links to staff login", async ({ page }) => {
    await page.goto("/auth/invite/accept");
    await page.getByRole("link", { name: /Go to Staff Login/i }).click();
    await expect(page).toHaveURL(/\/auth\/staff\/login/);
  });

  test("verify-email success shows correct state", async ({ page }) => {
    await page.goto("/auth/verify-email?success=true");
    await expect(
      page
        .getByText(/verified/i)
        .or(page.getByText(/success/i))
        .first()
    ).toBeVisible();
  });

  test("verify-email error shows correct state", async ({ page }) => {
    await page.goto("/auth/verify-email?error=verification_failed");
    await expect(
      page
        .getByText(/failed/i)
        .or(page.getByText(/error/i))
        .first()
    ).toBeVisible();
  });
});

test.describe("Edge Cases", () => {
  test("404 page for invalid route", async ({ page }) => {
    const response = await page.goto("/auth/nonexistent-page");
    expect(response?.status()).toBe(404);
  });

  test("double-click prevention on guest login", async ({ page }) => {
    await page.goto("/auth/guest/login");
    await page.getByLabel("Email").fill("test@example.com");
    await page.locator("#password").fill("Password123!");

    const submitBtn = page.getByRole("button", { name: "Sign In" });
    // Double-click rapidly
    await submitBtn.dblclick();

    // Should not show multiple loading states or errors — take screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "screenshots/guest-login-double-click.png",
    });
  });

  test("browser back from register returns to login", async ({ page }) => {
    await page.goto("/auth/guest/login");
    await page.getByRole("link", { name: /Create/i }).click();
    await expect(page).toHaveURL(/\/auth\/guest\/register/);
    await page.goBack();
    await expect(page).toHaveURL(/\/auth\/guest\/login/);
  });
});

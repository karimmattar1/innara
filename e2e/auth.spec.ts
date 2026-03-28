import { test, expect } from "@playwright/test";

test.describe("Guest Auth Pages", () => {
  test("guest login page renders correctly", async ({ page }) => {
    await page.goto("/auth/guest/login");

    // Logo visible
    await expect(page.locator("img[alt='INNARA']").first()).toBeVisible();

    // Heading
    await expect(page.getByRole("heading", { name: "Welcome Back" })).toBeVisible();
    await expect(page.getByText("Sign in to access your hotel experience")).toBeVisible();

    // Form fields
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Submit button
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();

    // Navigation links
    await expect(page.getByRole("link", { name: /Create/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Staff Console/i })).toBeVisible();
  });

  test("guest login validates required fields", async ({ page }) => {
    await page.goto("/auth/guest/login");

    const emailInput = page.getByLabel("Email");
    await expect(emailInput).toHaveAttribute("required", "");
  });

  test("guest login show/hide password toggle works", async ({ page }) => {
    await page.goto("/auth/guest/login");

    const passwordInput = page.locator("#password");
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click the show password button
    await page.getByRole("button", { name: /show password/i }).click();
    await expect(passwordInput).toHaveAttribute("type", "text");

    // Click again to hide
    await page.getByRole("button", { name: /hide password/i }).click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("guest register page renders correctly", async ({ page }) => {
    await page.goto("/auth/guest/register");

    await expect(page.getByRole("heading", { name: /Create Account/i })).toBeVisible();

    // Form fields
    await expect(page.getByLabel("Full Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();

    // Submit button
    await expect(page.getByRole("button", { name: /Create Account/i })).toBeVisible();

    // Link back to login
    await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();
  });

  test("guest login links to register page", async ({ page }) => {
    await page.goto("/auth/guest/login");
    await page.getByRole("link", { name: /Create/i }).click();
    await expect(page).toHaveURL(/\/auth\/guest\/register/);
  });

  test("guest register links to login page", async ({ page }) => {
    await page.goto("/auth/guest/register");
    await page.getByRole("link", { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/auth\/guest\/login/);
  });
});

test.describe("Staff Auth Pages", () => {
  test("staff login page renders correctly", async ({ page }) => {
    await page.goto("/auth/staff/login");

    // Logo visible
    await expect(page.locator("img[alt='INNARA']").first()).toBeVisible();

    // Heading
    await expect(page.getByRole("heading", { name: "Staff Console" })).toBeVisible();
    await expect(page.getByText("Access the operations dashboard")).toBeVisible();

    // Form fields
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.locator("#staff-password")).toBeVisible();

    // Submit button
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();

    // Links
    await expect(page.getByRole("link", { name: /Forgot password/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in here/i })).toBeVisible();
  });

  test("staff login links to forgot password", async ({ page }) => {
    await page.goto("/auth/staff/login");
    await page.getByRole("link", { name: /Forgot password/i }).click();
    await expect(page).toHaveURL(/\/auth\/staff\/forgot-password/);
  });

  test("staff login links to guest login", async ({ page }) => {
    await page.goto("/auth/staff/login");
    await page.getByRole("link", { name: /Sign in here/i }).click();
    await expect(page).toHaveURL(/\/auth\/guest\/login/);
  });

  test("forgot password page renders correctly", async ({ page }) => {
    await page.goto("/auth/staff/forgot-password");

    await expect(page.getByRole("heading", { name: /Forgot Password/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByRole("button", { name: /Send Reset Link/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to Sign In/i })).toBeVisible();
  });

  test("reset password page renders correctly", async ({ page }) => {
    await page.goto("/auth/staff/reset-password");

    await expect(page.getByRole("heading", { name: /Reset Password/i })).toBeVisible();
    await expect(page.locator("#reset-password")).toBeVisible();
    await expect(page.locator("#reset-confirm-password")).toBeVisible();
    await expect(page.getByRole("button", { name: /Update Password/i })).toBeVisible();
  });

  test("invite accept page shows error without params", async ({ page }) => {
    await page.goto("/auth/invite/accept");

    await expect(page.getByRole("heading", { name: /Invalid Invite Link/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Go to Staff Login/i })).toBeVisible();
  });
});

test.describe("Middleware — Role-Based Redirects", () => {
  test("unauthenticated access to /guest redirects to guest login", async ({ page }) => {
    await page.goto("/guest");
    await expect(page).toHaveURL(/\/auth\/guest\/login/);
  });

  test("unauthenticated access to /staff redirects to staff login", async ({ page }) => {
    await page.goto("/staff");
    await expect(page).toHaveURL(/\/auth\/staff\/login/);
  });

  test("unauthenticated access to /manager redirects to staff login", async ({ page }) => {
    await page.goto("/manager");
    await expect(page).toHaveURL(/\/auth\/staff\/login/);
  });

  test("unauthenticated access to /admin redirects to staff login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/staff\/login/);
  });

  test("auth pages are accessible without authentication", async ({ page }) => {
    const guestRes = await page.goto("/auth/guest/login");
    expect(guestRes?.status()).toBe(200);

    const staffRes = await page.goto("/auth/staff/login");
    expect(staffRes?.status()).toBe(200);

    const registerRes = await page.goto("/auth/guest/register");
    expect(registerRes?.status()).toBe(200);
  });
});

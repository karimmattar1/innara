import { test, expect } from "@playwright/test";

test.describe("Smoke Tests", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Innara");
  });

  test("guest login page loads", async ({ page }) => {
    await page.goto("/auth/guest/login");
    await expect(page.locator("h1")).toContainText("Guest Login");
  });

  test("staff login page loads", async ({ page }) => {
    await page.goto("/auth/staff/login");
    await expect(page.locator("h1")).toContainText("Staff Login");
  });
});

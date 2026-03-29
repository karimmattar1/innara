import { test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("capture all auth page screenshots", async ({ page }) => {
  test.setTimeout(120_000);
  const pages = [
    "/auth/guest/login",
    "/auth/guest/register",
    "/auth/staff/login",
    "/auth/staff/forgot-password",
    "/auth/staff/reset-password",
    "/auth/invite/accept",
    "/auth/verify-email?success=true",
    "/auth/verify-email?error=verification_failed",
    "/auth/guest/verify",
  ];

  for (const p of pages) {
    const name = p.replace(/[/?=&]/g, "-").replace(/^-/, "");

    // Desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(p, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `screenshots/${name}-desktop.png`,
      fullPage: true,
    });

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `screenshots/${name}-mobile.png`,
      fullPage: true,
    });
  }
});

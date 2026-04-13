import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// Performance Benchmarks (INN-124)
// ---------------------------------------------------------------------------
//
// Measures page load times, bundle sizes, and Core Web Vitals proxies
// using Playwright performance APIs. These tests establish baselines
// and catch regressions in subsequent builds.
// ---------------------------------------------------------------------------

const PERFORMANCE_BUDGET_MS = 5000; // 5s max page load for any route

// ---------------------------------------------------------------------------
// Page load time — public pages should load under budget
// ---------------------------------------------------------------------------

test.describe("Performance — Page Load Times", () => {
  const publicPages = [
    { path: "/auth/guest/login", label: "guest-login" },
    { path: "/auth/guest/register", label: "guest-register" },
    { path: "/auth/staff/login", label: "staff-login" },
    { path: "/offline", label: "offline" },
  ];

  for (const pg of publicPages) {
    test(`${pg.label} loads within ${PERFORMANCE_BUDGET_MS}ms`, async ({ page }) => {
      const start = Date.now();
      const response = await page.goto(pg.path, { waitUntil: "networkidle" });
      const loadTime = Date.now() - start;

      expect(response?.status()).toBeLessThan(400);
      expect(loadTime).toBeLessThan(PERFORMANCE_BUDGET_MS);
    });
  }
});

// ---------------------------------------------------------------------------
// Navigation performance — measuring performance.timing via JS
// ---------------------------------------------------------------------------

test.describe("Performance — Navigation Timing", () => {
  test("guest login FCP under 3 seconds", async ({ page }) => {
    await page.goto("/auth/guest/login", { waitUntil: "networkidle" });

    const fcp = await page.evaluate(() => {
      const entry = performance.getEntriesByType("paint")
        .find((e) => e.name === "first-contentful-paint");
      return entry?.startTime ?? null;
    });

    if (fcp !== null) {
      expect(fcp).toBeLessThan(3000);
    }
  });

  test("staff login DOM interactive under 3 seconds", async ({ page }) => {
    await page.goto("/auth/staff/login", { waitUntil: "networkidle" });

    const domInteractive = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return nav?.domInteractive ?? null;
    });

    if (domInteractive !== null) {
      expect(domInteractive).toBeLessThan(3000);
    }
  });
});

// ---------------------------------------------------------------------------
// Bundle size guard — static assets should be reasonable
// ---------------------------------------------------------------------------

test.describe("Performance — Resource Sizes", () => {
  test("guest login total transfer under 2MB", async ({ page }) => {
    let totalBytes = 0;

    page.on("response", (response) => {
      const headers = response.headers();
      const contentLength = parseInt(headers["content-length"] ?? "0", 10);
      if (contentLength > 0) {
        totalBytes += contentLength;
      }
    });

    await page.goto("/auth/guest/login", { waitUntil: "networkidle" });

    // 2MB budget for initial page load
    expect(totalBytes).toBeLessThan(2 * 1024 * 1024);
  });

  test("no single JS chunk exceeds 500KB", async ({ page }) => {
    const largeChunks: string[] = [];

    page.on("response", (response) => {
      const url = response.url();
      const headers = response.headers();
      const contentLength = parseInt(headers["content-length"] ?? "0", 10);

      if (url.includes(".js") && contentLength > 500 * 1024) {
        largeChunks.push(`${url} (${Math.round(contentLength / 1024)}KB)`);
      }
    });

    await page.goto("/auth/guest/login", { waitUntil: "networkidle" });

    expect(largeChunks).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// No console errors — pages should load cleanly
// ---------------------------------------------------------------------------

test.describe("Performance — Clean Load", () => {
  const pages = [
    "/auth/guest/login",
    "/auth/staff/login",
    "/offline",
  ];

  for (const path of pages) {
    test(`${path} loads without JS errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));

      await page.goto(path, { waitUntil: "networkidle" });

      expect(errors).toEqual([]);
    });
  }
});

// ---------------------------------------------------------------------------
// Cumulative Layout Shift — no major layout shifts
// ---------------------------------------------------------------------------

test.describe("Performance — Layout Stability", () => {
  test("guest login CLS under 0.1", async ({ page }) => {
    await page.goto("/auth/guest/login", { waitUntil: "networkidle" });

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
            if (!layoutShift.hadRecentInput) {
              clsValue += layoutShift.value;
            }
          }
        });
        observer.observe({ type: "layout-shift", buffered: true });
        // Give time for any shifts to settle
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1000);
      });
    });

    expect(cls).toBeLessThan(0.1);
  });
});

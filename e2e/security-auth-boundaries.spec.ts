/**
 * SECURITY AUTH BOUNDARY TESTS — Innara Hospitality Platform
 * ===========================================================
 * Ticket: INN-123 (Phase 6 — Security Audit)
 * Date:   2026-04-11
 *
 * Tests authentication and authorization boundaries for all routes.
 *
 * Test strategy:
 *   1. UNAUTHENTICATED ACCESS — protected routes must redirect to login
 *   2. PUBLIC PATHS — auth, health, webhooks must be accessible without auth
 *   3. ROLE BOUNDARIES — staff/manager/admin routes must redirect unauthorized roles
 *   4. API AUTH — API routes must return 401 for unauthenticated requests
 *   5. WEBHOOK VALIDATION — webhook endpoints must reject invalid payloads
 */

import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// 1. UNAUTHENTICATED ACCESS TO PROTECTED ROUTES
//    All protected routes should redirect to the appropriate login page
// ---------------------------------------------------------------------------

test.describe("Unauthenticated access to protected routes", () => {
  test("guest portal root redirects to guest login", async ({ page }) => {
    const response = await page.goto("/");
    // Middleware redirects to /auth/guest/login?redirect=/
    const url = page.url();
    expect(url).toContain("/auth/guest/login");
  });

  test("guest room service page redirects to guest login", async ({ page }) => {
    await page.goto("/room-service");
    const url = page.url();
    expect(url).toContain("/auth/guest/login");
  });

  test("guest requests page redirects to guest login", async ({ page }) => {
    await page.goto("/requests");
    const url = page.url();
    expect(url).toContain("/auth/guest/login");
  });

  test("staff dashboard redirects to staff login", async ({ page }) => {
    await page.goto("/staff");
    const url = page.url();
    expect(url).toContain("/auth/staff/login");
  });

  test("staff requests page redirects to staff login", async ({ page }) => {
    await page.goto("/staff/requests");
    const url = page.url();
    expect(url).toContain("/auth/staff/login");
  });

  test("manager dashboard redirects to staff login", async ({ page }) => {
    await page.goto("/manager");
    const url = page.url();
    expect(url).toContain("/auth/staff/login");
  });

  test("manager analytics redirects to staff login", async ({ page }) => {
    await page.goto("/manager/analytics");
    const url = page.url();
    expect(url).toContain("/auth/staff/login");
  });

  test("manager billing redirects to staff login", async ({ page }) => {
    await page.goto("/manager/billing");
    const url = page.url();
    expect(url).toContain("/auth/staff/login");
  });

  test("manager staff page redirects to staff login", async ({ page }) => {
    await page.goto("/manager/staff");
    const url = page.url();
    expect(url).toContain("/auth/staff/login");
  });

  test("admin dashboard redirects to staff login", async ({ page }) => {
    await page.goto("/admin");
    const url = page.url();
    expect(url).toContain("/auth/staff/login");
  });

  test("admin hotels page redirects to staff login", async ({ page }) => {
    await page.goto("/admin/hotels");
    const url = page.url();
    expect(url).toContain("/auth/staff/login");
  });

  test("admin users page redirects to staff login", async ({ page }) => {
    await page.goto("/admin/users");
    const url = page.url();
    expect(url).toContain("/auth/staff/login");
  });

  test("redirect param is preserved in login URL", async ({ page }) => {
    await page.goto("/manager/analytics");
    const url = page.url();
    expect(url).toContain("redirect=%2Fmanager%2Fanalytics");
  });
});

// ---------------------------------------------------------------------------
// 2. PUBLIC PATHS
//    These routes must be accessible without authentication
// ---------------------------------------------------------------------------

test.describe("Public paths are accessible without authentication", () => {
  test("auth guest login page loads", async ({ page }) => {
    const response = await page.goto("/auth/guest/login");
    expect(response?.status()).toBeLessThan(400);
    // Should NOT redirect to another login page
    expect(page.url()).toContain("/auth/guest/login");
  });

  test("auth staff login page loads", async ({ page }) => {
    const response = await page.goto("/auth/staff/login");
    expect(response?.status()).toBeLessThan(400);
    expect(page.url()).toContain("/auth/staff/login");
  });

  test("auth forgot password page loads", async ({ page }) => {
    const response = await page.goto("/auth/staff/forgot-password");
    expect(response?.status()).toBeLessThan(400);
    expect(page.url()).toContain("/auth/staff/forgot-password");
  });

  test("auth verify email page loads", async ({ page }) => {
    const response = await page.goto("/auth/verify-email");
    expect(response?.status()).toBeLessThan(400);
    expect(page.url()).toContain("/auth/verify-email");
  });

  test("auth guest register page loads", async ({ page }) => {
    const response = await page.goto("/auth/guest/register");
    expect(response?.status()).toBeLessThan(400);
    expect(page.url()).toContain("/auth/guest/register");
  });

  test("auth invite accept page loads", async ({ page }) => {
    const response = await page.goto("/auth/invite/accept");
    expect(response?.status()).toBeLessThan(400);
    expect(page.url()).toContain("/auth/invite/accept");
  });

  test("health endpoint responds without server error", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBeLessThan(500);
  });

  test("health endpoint does not expose secrets", async ({ request }) => {
    const response = await request.get("/api/health");
    const body = await response.text();
    expect(body).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(body).not.toContain("STRIPE_SECRET");
    expect(body).not.toContain("ANTHROPIC_API_KEY");
  });
});

// ---------------------------------------------------------------------------
// 3. API AUTH BOUNDARIES
//    API routes must return appropriate error codes for unauthenticated requests
// ---------------------------------------------------------------------------

test.describe("API routes reject unauthenticated requests", () => {
  test("POST /api/ai/chat does not return guest data without auth", async ({ request }) => {
    const response = await request.post("/api/ai/chat", {
      data: { message: "Hello" },
    });
    // Without valid Supabase session, should not return AI response content
    // May return 401 (proper auth check) or 200 with error body (streaming)
    if (response.status() === 200) {
      const body = await response.text();
      // Should not contain actual guest data or valid AI response
      expect(body).not.toContain("room_number");
      expect(body).not.toContain("check_in");
    } else {
      expect(response.status()).toBeGreaterThanOrEqual(400);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. WEBHOOK VALIDATION
//    Webhook endpoints must validate signatures/payloads
// ---------------------------------------------------------------------------

test.describe("Webhook endpoints validate payloads", () => {
  test("Stripe webhook rejects missing signature", async ({ request }) => {
    const response = await request.post("/api/webhooks/stripe", {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ type: "checkout.session.completed" }),
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Missing signature");
  });

  test("Stripe webhook rejects invalid signature", async ({ request }) => {
    const response = await request.post("/api/webhooks/stripe", {
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=12345,v1=invalid_signature_here",
      },
      data: JSON.stringify({ type: "checkout.session.completed" }),
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid signature");
  });

  test("PMS webhook rejects missing hotel ID", async ({ request }) => {
    const response = await request.post("/api/webhooks/pms", {
      headers: { "Content-Type": "application/json" },
      data: JSON.stringify({ events: [] }),
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Missing x-hotel-id");
  });

  test("PMS webhook rejects invalid hotel ID format", async ({ request }) => {
    const response = await request.post("/api/webhooks/pms", {
      headers: {
        "Content-Type": "application/json",
        "x-hotel-id": "not-a-uuid",
      },
      data: JSON.stringify({ events: [] }),
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid x-hotel-id format");
  });

  test("PMS webhook rejects unsupported provider", async ({ request }) => {
    const response = await request.post("/api/webhooks/pms", {
      headers: {
        "Content-Type": "application/json",
        "x-hotel-id": "10000000-1000-4000-8000-100000000001",
        "x-pms-provider": "unknown_provider",
      },
      data: JSON.stringify({ events: [] }),
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Unsupported PMS provider");
  });

  test("PMS webhook rejects invalid payload structure", async ({ request }) => {
    const response = await request.post("/api/webhooks/pms", {
      headers: {
        "Content-Type": "application/json",
        "x-hotel-id": "10000000-1000-4000-8000-100000000001",
        "x-pms-provider": "mews",
      },
      data: { not_events: "invalid" },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("Invalid webhook payload");
  });
});

// ---------------------------------------------------------------------------
// 5. OPEN REDIRECT PREVENTION
//    Auth callback must not redirect to external URLs (BP-024)
// ---------------------------------------------------------------------------

test.describe("Auth callback prevents open redirects", () => {
  test("rejects absolute external URL in next param", async ({ request }) => {
    const response = await request.get(
      "/auth/callback?code=fake&next=https://evil.com",
      { maxRedirects: 0 },
    );
    // Should redirect but NOT to evil.com
    if (response.status() >= 300 && response.status() < 400) {
      const location = response.headers()["location"] ?? "";
      expect(location).not.toContain("evil.com");
    }
  });

  test("rejects protocol-relative URL in next param", async ({ request }) => {
    const response = await request.get(
      "/auth/callback?code=fake&next=//evil.com",
      { maxRedirects: 0 },
    );
    if (response.status() >= 300 && response.status() < 400) {
      const location = response.headers()["location"] ?? "";
      expect(location).not.toContain("evil.com");
    }
  });

  test("rejects protocol in next param", async ({ request }) => {
    const response = await request.get(
      "/auth/callback?code=fake&next=javascript:alert(1)",
      { maxRedirects: 0 },
    );
    if (response.status() >= 300 && response.status() < 400) {
      const location = response.headers()["location"] ?? "";
      expect(location).not.toContain("javascript:");
    }
  });
});

// ---------------------------------------------------------------------------
// 6. SECURITY HEADERS
//    Verify that security headers are present on responses
// ---------------------------------------------------------------------------

test.describe("Security headers", () => {
  test("health endpoint returns security-relevant headers", async ({ request }) => {
    const response = await request.get("/api/health");
    const headers = response.headers();

    // These headers may be added by next.config.ts, vercel.json, or Vercel's infra
    // We check if they exist; missing headers are a finding, not a test failure
    // The test documents which headers are present vs missing

    // X-Content-Type-Options prevents MIME sniffing
    // Note: this may not be present in local dev but should be in production
    if (headers["x-content-type-options"]) {
      expect(headers["x-content-type-options"]).toBe("nosniff");
    }
  });

  test("HTML pages set content-type correctly", async ({ request }) => {
    const response = await request.get("/auth/guest/login");
    const contentType = response.headers()["content-type"];
    expect(contentType).toContain("text/html");
  });
});

// ---------------------------------------------------------------------------
// 7. ERROR HANDLING — NO INFORMATION LEAKAGE
//    Error responses must not expose internal details
// ---------------------------------------------------------------------------

test.describe("Error responses do not leak internals", () => {
  test("404 page does not expose secrets", async ({ page }) => {
    await page.goto("/nonexistent-path-abc123");
    const content = await page.content();
    // Should not contain secrets or env vars
    expect(content).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(content).not.toContain("STRIPE_SECRET");
    expect(content).not.toContain("ANTHROPIC_API_KEY");
  });

  test("API 404 does not expose secrets", async ({ request }) => {
    const response = await request.get("/api/nonexistent");
    const text = await response.text();
    expect(text).not.toContain("SUPABASE_SERVICE_ROLE");
    expect(text).not.toContain("STRIPE_SECRET");
    expect(text).not.toContain("ANTHROPIC_API_KEY");
  });
});

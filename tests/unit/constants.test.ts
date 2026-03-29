import { describe, it, expect } from "vitest";
import { APP_NAME, ROLES, PORTAL_ROUTES, DESIGN_TOKENS } from "@/constants/app";

describe("App Constants", () => {
  it("has correct app name", () => {
    expect(APP_NAME).toBe("Innara");
  });

  it("has all five roles defined", () => {
    expect(ROLES.GUEST).toBe("guest");
    expect(ROLES.STAFF).toBe("staff");
    expect(ROLES.FRONT_DESK).toBe("front_desk");
    expect(ROLES.MANAGER).toBe("manager");
    expect(ROLES.SUPER_ADMIN).toBe("super_admin");
  });

  it("has portal routes for each role", () => {
    expect(PORTAL_ROUTES.guest).toBe("/guest");
    expect(PORTAL_ROUTES.staff).toBe("/staff");
    expect(PORTAL_ROUTES.manager).toBe("/manager");
    expect(PORTAL_ROUTES.admin).toBe("/admin");
  });

  it("has correct brand colors", () => {
    expect(DESIGN_TOKENS.NAVY).toBe("#1a1d3a");
    expect(DESIGN_TOKENS.BRONZE).toBe("#9B7340");
  });
});

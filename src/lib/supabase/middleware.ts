import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Portal access rules:
 * - /staff/*    → staff, front_desk, manager, super_admin
 * - /manager/*  → manager, super_admin
 * - /admin/*    → super_admin
 * - /auth/*     → public (no auth required)
 * - /*          → guest portal (authenticated guests, or redirect to login)
 */

const PUBLIC_PATHS = [
  "/auth",
  "/api/webhooks",
  "/_next",
  "/favicon.ico",
];

const ROLE_ACCESS: Record<string, string[]> = {
  "/staff": ["staff", "front_desk", "manager", "super_admin"],
  "/manager": ["manager", "super_admin"],
  "/admin": ["super_admin"],
};

const ROLE_HOME: Record<string, string> = {
  super_admin: "/admin",
  manager: "/manager",
  front_desk: "/staff",
  staff: "/staff",
  guest: "/",
};

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path));
}

function getRequiredRoles(pathname: string): string[] | null {
  for (const [prefix, roles] of Object.entries(ROLE_ACCESS)) {
    if (pathname.startsWith(prefix)) {
      return roles;
    }
  }
  return null; // Guest portal — any authenticated user
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const pathname = request.nextUrl.pathname;

  // Skip auth check for public paths
  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  // Refresh session — critical for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated → redirect to appropriate login
  if (!user) {
    const loginPath = pathname.startsWith("/staff") || pathname.startsWith("/manager") || pathname.startsWith("/admin")
      ? "/auth/staff/login"
      : "/auth/guest/login";
    const url = request.nextUrl.clone();
    url.pathname = loginPath;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Get role from JWT claims
  const session = await supabase.auth.getSession();
  const jwt = session.data.session?.access_token;
  let userRole = "guest";

  if (jwt) {
    try {
      // Decode JWT payload (base64url)
      const payload = JSON.parse(
        Buffer.from(jwt.split(".")[1], "base64url").toString()
      );
      userRole = payload.app_role || "guest";
    } catch {
      // If JWT decode fails, default to guest
    }
  }

  // Check portal access
  const requiredRoles = getRequiredRoles(pathname);

  if (requiredRoles && !requiredRoles.includes(userRole)) {
    // User doesn't have access to this portal → redirect to their home
    const url = request.nextUrl.clone();
    url.pathname = ROLE_HOME[userRole] || "/";
    return NextResponse.redirect(url);
  }

  // Authenticated staff/manager/admin accessing guest portal root → redirect to their portal
  if (pathname === "/" && userRole !== "guest") {
    const homePath = ROLE_HOME[userRole];
    if (homePath && homePath !== "/") {
      const url = request.nextUrl.clone();
      url.pathname = homePath;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

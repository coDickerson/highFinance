import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const ROLE_RANK: Record<string, number> = { officer: 1, executive: 2, admin: 3 };

const EXEC_ALLOWED_ADMIN_ROUTES = ["/admin/members"];

const ROUTE_REQUIREMENTS: Array<{ prefix: string; minRole: string }> = [
  { prefix: "/admin", minRole: "admin" },
  { prefix: "/executive", minRole: "executive" },
  { prefix: "/officer", minRole: "officer" },
  { prefix: "/budgets", minRole: "officer" },
  { prefix: "/transactions", minRole: "officer" },
  { prefix: "/requests", minRole: "officer" },
  { prefix: "/settings", minRole: "officer" },
  { prefix: "/dashboard", minRole: "officer" },
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname === "/login" || pathname === "/signup") {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const userRank = ROLE_RANK[session.user?.role ?? ""] ?? 0;

  // Execs can access specific admin routes (read-only, enforced at page level)
  if (EXEC_ALLOWED_ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (userRank < ROLE_RANK["executive"]) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  for (const { prefix, minRole } of ROUTE_REQUIREMENTS) {
    if (pathname.startsWith(prefix)) {
      const required = ROLE_RANK[minRole];
      if (userRank < required) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      break;
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|api/auth|api/signup$|api/demo|favicon|manifest.webmanifest|icon.svg|sw.js).*)",
  ],
};

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-session";

export function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/admin/login";
  const isAuthenticated = verifyAdminSessionToken(request.cookies.get(adminSessionCookieName)?.value);

  if (!isLoginPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

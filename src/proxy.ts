import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { adminSessionCookieName, verifyAdminSessionToken } from "@/lib/admin-jwt";

export async function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (isLoginPage) {
    return NextResponse.next();
  }

  const isAuthenticated = Boolean(
    await verifyAdminSessionToken(request.cookies.get(adminSessionCookieName)?.value),
  );

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

import { NextResponse } from "next/server";
import { adminSessionCookieName, adminSessionCookieOptions } from "@/lib/admin-jwt";

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ message: "Requete refusee." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieName, "", {
    ...adminSessionCookieOptions,
    maxAge: 0,
  });
  return response;
}

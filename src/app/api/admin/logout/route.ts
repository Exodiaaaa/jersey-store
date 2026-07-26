import { NextResponse } from "next/server";
import { adminSessionCookieName } from "@/lib/admin-session";

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ message: "Requete refusee." }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieName, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

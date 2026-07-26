import { NextResponse } from "next/server";
import {
  adminSessionCookieName,
  adminSessionMaxAgeSeconds,
  createAdminSessionToken,
  isAdminAuthConfigured,
  verifyAdminCredentials,
} from "@/lib/admin-session";

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ message: "Requete refusee." }, { status: 403 });
  }

  if (!isAdminAuthConfigured()) {
    console.error("Admin authentication is not configured. Check ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_SESSION_SECRET.");
    return NextResponse.json({ message: "Connexion admin indisponible." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  if (typeof body?.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ message: "Email et mot de passe requis." }, { status: 400 });
  }

  if (!verifyAdminCredentials(body.email, body.password)) {
    return NextResponse.json({ message: "Email ou mot de passe incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieName, createAdminSessionToken(), {
    httpOnly: true,
    maxAge: adminSessionMaxAgeSeconds,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

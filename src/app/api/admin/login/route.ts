import { NextResponse } from "next/server";
import {
  createAdminJwt,
  isAdminAuthConfigured,
  verifyAdminCredentials,
} from "@/lib/admin-session";
import { adminSessionCookieName, adminSessionCookieOptions } from "@/lib/admin-jwt";

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ message: "Requete refusee." }, { status: 403 });
  }

  if (!(await isAdminAuthConfigured())) {
    console.error("Admin authentication is not configured. Check the admin account and Docker JWT secret.");
    return NextResponse.json({ message: "Connexion admin indisponible." }, { status: 503 });
  }

  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  if (typeof body?.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ message: "Email et mot de passe requis." }, { status: 400 });
  }

  const admin = await verifyAdminCredentials(body.email, body.password);
  if (!admin) {
    return NextResponse.json({ message: "Email ou mot de passe incorrect." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(adminSessionCookieName, await createAdminJwt(admin), adminSessionCookieOptions);
  return response;
}

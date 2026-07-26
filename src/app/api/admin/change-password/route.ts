import { NextResponse } from "next/server";
import { adminSessionCookieName, adminSessionCookieOptions } from "@/lib/admin-jwt";
import { hashAdminPassword, validateAdminPassword, verifyAdminPassword } from "@/lib/admin-password";
import { createAdminJwt, getAuthenticatedAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ message: "Requete refusee." }, { status: 403 });
  }

  const authenticatedAdmin = await getAuthenticatedAdmin(request);
  if (!authenticatedAdmin) {
    return NextResponse.json({ message: "Session admin requise." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    confirmPassword?: unknown;
    currentPassword?: unknown;
    newPassword?: unknown;
  } | null;

  if (
    typeof body?.currentPassword !== "string" ||
    typeof body.newPassword !== "string" ||
    typeof body.confirmPassword !== "string"
  ) {
    return NextResponse.json({ message: "Tous les champs sont requis." }, { status: 400 });
  }

  if (body.newPassword !== body.confirmPassword) {
    return NextResponse.json({ message: "La confirmation du nouveau mot de passe ne correspond pas." }, { status: 400 });
  }

  const passwordError = validateAdminPassword(body.newPassword);
  if (passwordError) {
    return NextResponse.json({ message: passwordError }, { status: 400 });
  }

  if (body.currentPassword === body.newPassword) {
    return NextResponse.json({ message: "Le nouveau mot de passe doit etre different de l'ancien." }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    select: { passwordHash: true },
    where: { id: authenticatedAdmin.id },
  });

  if (!admin || !(await verifyAdminPassword(body.currentPassword, admin.passwordHash))) {
    return NextResponse.json({ message: "Le mot de passe actuel est incorrect." }, { status: 401 });
  }

  const updatedAdmin = await prisma.adminUser.update({
    data: {
      passwordHash: await hashAdminPassword(body.newPassword),
      tokenVersion: { increment: 1 },
    },
    select: { email: true, id: true, role: true, tokenVersion: true },
    where: { id: authenticatedAdmin.id },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(
    adminSessionCookieName,
    await createAdminJwt({ ...updatedAdmin, role: "admin" }),
    adminSessionCookieOptions,
  );
  return response;
}

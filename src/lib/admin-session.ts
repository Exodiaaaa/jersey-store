import { prisma } from "@/lib/prisma";
import { verifyAdminPassword } from "@/lib/admin-password";
import {
  adminSessionCookieName,
  createAdminSessionToken,
  isAdminJwtConfigured,
  verifyAdminSessionToken,
} from "@/lib/admin-jwt";

const dummyPasswordHash = "$2b$12$m854qDGO7MhTknBvnBOfXurXhkLZsaWgt8AfSOyHTO.T7Rr31YELe";

export type AuthenticatedAdmin = {
  email: string;
  id: string;
  role: "admin";
  tokenVersion: number;
};

export async function verifyAdminCredentials(email: string, password: string) {
  const admin = await prisma.adminUser.findUnique({
    select: {
      email: true,
      id: true,
      passwordHash: true,
      role: true,
      tokenVersion: true,
    },
    where: { email: email.trim().toLowerCase() },
  });

  const passwordMatches = await verifyAdminPassword(password, admin?.passwordHash ?? dummyPasswordHash);

  if (!admin || admin.role !== "admin" || !passwordMatches) {
    return null;
  }

  return {
    email: admin.email,
    id: admin.id,
    role: "admin" as const,
    tokenVersion: admin.tokenVersion,
  };
}

export async function createAdminJwt(admin: AuthenticatedAdmin, now = Date.now()) {
  return createAdminSessionToken(
    {
      adminId: admin.id,
      role: admin.role,
      tokenVersion: admin.tokenVersion,
    },
    now,
  );
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return undefined;

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName === name) {
      try {
        return decodeURIComponent(rawValue.join("="));
      } catch {
        return undefined;
      }
    }
  }

  return undefined;
}

export async function getAuthenticatedAdmin(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), adminSessionCookieName);
  const session = await verifyAdminSessionToken(token);

  if (!session) {
    return null;
  }

  const admin = await prisma.adminUser.findUnique({
    select: { email: true, id: true, role: true, tokenVersion: true },
    where: { id: session.adminId },
  });

  if (!admin || admin.role !== "admin" || admin.tokenVersion !== session.tokenVersion) {
    return null;
  }

  return {
    email: admin.email,
    id: admin.id,
    role: "admin" as const,
    tokenVersion: admin.tokenVersion,
  };
}

export async function isAdminAuthConfigured() {
  if (!isAdminJwtConfigured()) {
    return false;
  }

  return (await prisma.adminUser.count({ where: { role: "admin" } })) > 0;
}

export async function requireAdmin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ message: "Requete refusee." }, { status: 403 });
  }

  if (!(await getAuthenticatedAdmin(request))) {
    return Response.json({ message: "Session admin requise." }, { status: 401 });
  }

  return null;
}

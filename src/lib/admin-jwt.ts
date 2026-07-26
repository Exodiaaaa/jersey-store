import { readFileSync } from "node:fs";
import { SignJWT, jwtVerify } from "jose";

export const adminSessionCookieName = "kvn_admin_session";
export const adminSessionMaxAgeSeconds = 12 * 60 * 60;

const adminJwtIssuer = "kvn-footwear";
const adminJwtAudience = "kvn-admin";
const adminJwtSecretFile = "/run/secrets/admin_jwt_secret";

export type AdminJwtPayload = {
  adminId: string;
  role: "admin";
  tokenVersion: number;
};

function readAdminJwtSecret() {
  try {
    return readFileSync(adminJwtSecretFile, "utf8").trim();
  } catch {
    if (process.env.NODE_ENV !== "production") {
      return process.env.ADMIN_JWT_SECRET?.trim() ?? "";
    }

    return "";
  }
}

function getAdminJwtKey() {
  const secret = readAdminJwtSecret();

  if (secret.length < 32) {
    throw new Error("Le secret JWT admin doit contenir au moins 32 caracteres.");
  }

  return new TextEncoder().encode(secret);
}

export function isAdminJwtConfigured() {
  try {
    getAdminJwtKey();
    return true;
  } catch {
    return false;
  }
}

export async function createAdminSessionToken(payload: AdminJwtPayload, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000);

  return new SignJWT({
    role: payload.role,
    tokenVersion: payload.tokenVersion,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(payload.adminId)
    .setIssuer(adminJwtIssuer)
    .setAudience(adminJwtAudience)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + adminSessionMaxAgeSeconds)
    .sign(getAdminJwtKey());
}

export async function verifyAdminSessionToken(token: string | undefined, now = Date.now()) {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getAdminJwtKey(), {
      algorithms: ["HS256"],
      audience: adminJwtAudience,
      currentDate: new Date(now),
      issuer: adminJwtIssuer,
    });

    if (
      typeof payload.sub !== "string" ||
      payload.role !== "admin" ||
      !Number.isInteger(payload.tokenVersion)
    ) {
      return null;
    }

    return {
      adminId: payload.sub,
      role: "admin" as const,
      tokenVersion: payload.tokenVersion as number,
    };
  } catch {
    return null;
  }
}

export const adminSessionCookieOptions = {
  httpOnly: true,
  maxAge: adminSessionMaxAgeSeconds,
  path: "/",
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
};

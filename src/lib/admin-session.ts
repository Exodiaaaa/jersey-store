import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const adminSessionCookieName = "kvn_admin_session";
export const adminSessionMaxAgeSeconds = 12 * 60 * 60;

type AdminSessionPayload = {
  exp: number;
  role: "admin";
};

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

function safeEqual(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function isAdminAuthConfigured() {
  return Boolean(
    process.env.ADMIN_EMAIL?.trim() &&
      process.env.ADMIN_PASSWORD &&
      getSessionSecret(),
  );
}

export function verifyAdminCredentials(email: string, password: string) {
  const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!configuredEmail || !configuredPassword || !getSessionSecret()) {
    return false;
  }

  const emailMatches = safeEqual(email.trim().toLowerCase(), configuredEmail);
  const passwordMatches = safeEqual(password, configuredPassword);
  return emailMatches && passwordMatches;
}

export function createAdminSessionToken(now = Date.now()) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }

  const payload: AdminSessionPayload = {
    exp: Math.floor(now / 1000) + adminSessionMaxAgeSeconds,
    role: "admin",
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifyAdminSessionToken(token: string | undefined, now = Date.now()) {
  const secret = getSessionSecret();
  if (!token || !secret) {
    return false;
  }

  const [encodedPayload, signature, extraPart] = token.split(".");
  if (!encodedPayload || !signature || extraPart) {
    return false;
  }

  if (!safeEqual(signature, sign(encodedPayload, secret))) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as AdminSessionPayload;
    return payload.role === "admin" && Number.isInteger(payload.exp) && payload.exp > Math.floor(now / 1000);
  } catch {
    return false;
  }
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

export function hasValidAdminSession(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), adminSessionCookieName);
  return verifyAdminSessionToken(token);
}

export function requireAdmin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ message: "Requete refusee." }, { status: 403 });
  }

  if (!hasValidAdminSession(request)) {
    return Response.json({ message: "Session admin requise." }, { status: 401 });
  }

  return null;
}

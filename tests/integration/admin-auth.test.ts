import assert from "node:assert/strict";
import { before, describe, test } from "node:test";
import { hashAdminPassword, verifyAdminPassword } from "../../src/lib/admin-password";
import { adminSessionCookieName, createAdminSessionToken } from "../../src/lib/admin-jwt";

const state = {
  admin: {
    email: "admin@example.test",
    id: "admin-1",
    passwordHash: "",
    role: "admin",
    tokenVersion: 0,
  },
};

const fakePrisma = {
  adminUser: {
    async count() {
      return 1;
    },
    async findUnique({ where }: { where: { email?: string; id?: string } }) {
      if (where.email && where.email !== state.admin.email) return null;
      if (where.id && where.id !== state.admin.id) return null;
      return { ...state.admin };
    },
    async update({ data }: { data: { passwordHash: string; tokenVersion: { increment: number } } }) {
      state.admin.passwordHash = data.passwordHash;
      state.admin.tokenVersion += data.tokenVersion.increment;
      return { ...state.admin };
    },
  },
};

(globalThis as { prisma?: unknown }).prisma = fakePrisma;

type LoginRoute = {
  POST(request: Request): Promise<Response>;
};

type ChangePasswordRoute = {
  POST(request: Request): Promise<Response>;
};

let loginRoute: LoginRoute;
let changePasswordRoute: ChangePasswordRoute;
let oldToken = "";

function unwrapModule<T extends object>(module: T | { default: T }) {
  return "default" in module ? module.default : module;
}

function jsonRequest(url: string, body: unknown, cookie?: string) {
  return new Request(url, {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    method: "POST",
  });
}

function getCookieToken(response: Response) {
  const setCookie = response.headers.get("set-cookie") ?? "";
  const match = setCookie.match(new RegExp(`${adminSessionCookieName}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
}

describe("admin authentication routes", () => {
  before(async () => {
    process.env.ADMIN_JWT_SECRET = "test-jwt-secret-with-at-least-32-characters";
    state.admin.passwordHash = await hashAdminPassword("AncienMotDePasse2026");
    oldToken = await createAdminSessionToken({
      adminId: state.admin.id,
      role: "admin",
      tokenVersion: state.admin.tokenVersion,
    });
    loginRoute = unwrapModule(await import("../../src/app/api/admin/login/route"));
    changePasswordRoute = unwrapModule(await import("../../src/app/api/admin/change-password/route"));
  });

  test("connecte un administrateur stocke en base et emet un JWT", async () => {
    const response = await loginRoute.POST(
      jsonRequest("http://localhost/api/admin/login", {
        email: "ADMIN@example.test",
        password: "AncienMotDePasse2026",
      }),
    );
    const token = getCookieToken(response);

    assert.equal(response.status, 200);
    assert.equal(token.split(".").length, 3);
    assert.match(response.headers.get("set-cookie") ?? "", /HttpOnly/);
    assert.match(response.headers.get("set-cookie") ?? "", /SameSite=strict/i);
  });

  test("refuse un mot de passe incorrect", async () => {
    const response = await loginRoute.POST(
      jsonRequest("http://localhost/api/admin/login", {
        email: "admin@example.test",
        password: "MotDePasseIncorrect2026",
      }),
    );

    assert.equal(response.status, 401);
  });

  test("change le hash, incremente la version et renouvelle le JWT", async () => {
    const response = await changePasswordRoute.POST(
      jsonRequest(
        "http://localhost/api/admin/change-password",
        {
          confirmPassword: "NouveauMotDePasse2027",
          currentPassword: "AncienMotDePasse2026",
          newPassword: "NouveauMotDePasse2027",
        },
        `${adminSessionCookieName}=${oldToken}`,
      ),
    );
    const newToken = getCookieToken(response);

    assert.equal(response.status, 200);
    assert.equal(state.admin.tokenVersion, 1);
    assert.equal(await verifyAdminPassword("NouveauMotDePasse2027", state.admin.passwordHash), true);
    assert.equal(newToken.split(".").length, 3);
    assert.notEqual(newToken, oldToken);
  });
});

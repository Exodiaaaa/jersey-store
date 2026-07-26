import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import {
  adminSessionCookieName,
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "../../src/lib/admin-jwt";
import {
  hashAdminPassword,
  validateAdminPassword,
  verifyAdminPassword,
} from "../../src/lib/admin-password";

const admin = {
  adminId: "admin-1",
  role: "admin" as const,
  tokenVersion: 2,
};

describe("admin authentication", () => {
  beforeEach(() => {
    process.env.ADMIN_JWT_SECRET = "test-jwt-secret-with-at-least-32-characters";
  });

  test("hache et verifie le mot de passe", async () => {
    const passwordHash = await hashAdminPassword("MotDePasseTest2026");

    assert.notEqual(passwordHash, "MotDePasseTest2026");
    assert.equal(await verifyAdminPassword("MotDePasseTest2026", passwordHash), true);
    assert.equal(await verifyAdminPassword("MotDePasseIncorrect2026", passwordHash), false);
  });

  test("valide la politique de mot de passe", () => {
    assert.equal(validateAdminPassword("court1"), "Le mot de passe doit contenir au moins 12 caracteres.");
    assert.equal(validateAdminPassword("MotDePasseSansChiffre"), "Le mot de passe doit contenir au moins une lettre et un chiffre.");
    assert.equal(validateAdminPassword("MotDePasseValide2026"), null);
  });

  test("cree un JWT standard, le verifie et l'expire", async () => {
    const now = Date.UTC(2026, 6, 26, 12, 0, 0);
    const token = await createAdminSessionToken(admin, now);

    assert.equal(token.split(".").length, 3);
    assert.deepEqual(await verifyAdminSessionToken(token, now), admin);
    assert.equal(await verifyAdminSessionToken(`${token}x`, now), null);
    assert.equal(await verifyAdminSessionToken(token, now + 13 * 60 * 60 * 1000), null);
  });

  test("utilise un cookie admin distinct", () => {
    assert.equal(adminSessionCookieName, "kvn_admin_session");
  });
});

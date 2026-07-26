import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import {
  adminSessionCookieName,
  createAdminSessionToken,
  hasValidAdminSession,
  verifyAdminCredentials,
  verifyAdminSessionToken,
} from "../../src/lib/admin-session";

describe("admin session", () => {
  beforeEach(() => {
    process.env.ADMIN_EMAIL = "admin@example.test";
    process.env.ADMIN_PASSWORD = "test-password";
    process.env.ADMIN_SESSION_SECRET = "test-session-secret-with-at-least-32-characters";
  });

  test("valide les identifiants uniquement cote serveur", () => {
    assert.equal(verifyAdminCredentials("ADMIN@example.test", "test-password"), true);
    assert.equal(verifyAdminCredentials("admin@example.test", "wrong-password"), false);
  });

  test("signe, verifie et expire la session", () => {
    const now = Date.UTC(2026, 6, 26, 12, 0, 0);
    const token = createAdminSessionToken(now);

    assert.equal(verifyAdminSessionToken(token, now), true);
    assert.equal(verifyAdminSessionToken(`${token}x`, now), false);
    assert.equal(verifyAdminSessionToken(token, now + 13 * 60 * 60 * 1000), false);
  });

  test("lit la session depuis le cookie HTTP", () => {
    const token = createAdminSessionToken();
    const request = new Request("http://localhost/api/dashboard", {
      headers: { cookie: `${adminSessionCookieName}=${token}` },
    });

    assert.equal(hasValidAdminSession(request), true);
  });
});

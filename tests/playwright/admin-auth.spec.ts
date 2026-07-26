import { expect, test } from "@playwright/test";
import { adminSessionCookieName, createAdminSessionToken } from "../../src/lib/admin-jwt";

const playwrightJwtSecret = "playwright-jwt-secret-with-at-least-32-characters";

test("ouvre la popup et change le mot de passe admin", async ({ baseURL, page }) => {
  process.env.ADMIN_JWT_SECRET = playwrightJwtSecret;
  const token = await createAdminSessionToken({
    adminId: "admin-playwright",
    role: "admin",
    tokenVersion: 0,
  });

  await page.context().addCookies([
    {
      name: adminSessionCookieName,
      url: baseURL,
      value: token,
    },
  ]);

  await page.route("**/api/dashboard", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        orderCount: 0,
        recentOrders: [],
        revenue: 0,
        topProducts: [],
      },
    });
  });

  await page.route("**/api/admin/change-password", async (route) => {
    const body = JSON.parse(route.request().postData() ?? "{}") as Record<string, string>;
    expect(body.currentPassword).toBe("AncienMotDePasse2026");
    expect(body.newPassword).toBe("NouveauMotDePasse2027");
    expect(body.confirmPassword).toBe("NouveauMotDePasse2027");
    await route.fulfill({ contentType: "application/json", json: { ok: true } });
  });

  await page.goto("/admin/dashboard");
  await page.getByRole("button", { name: "Changer le mot de passe" }).click();

  const dialog = page.getByRole("dialog", { name: "Changer le mot de passe" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Mot de passe actuel").fill("AncienMotDePasse2026");
  await dialog.getByLabel("Nouveau mot de passe", { exact: true }).fill("NouveauMotDePasse2027");
  await dialog.getByLabel("Confirmer le nouveau mot de passe").fill("NouveauMotDePasse2027");
  await dialog.getByRole("button", { name: "Enregistrer" }).click();

  await expect(dialog.getByText("Mot de passe modifie.", { exact: false })).toBeVisible();
});

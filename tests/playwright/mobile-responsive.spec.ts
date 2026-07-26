import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { adminSessionCookieName, createAdminSessionToken } from "../../src/lib/admin-jwt";
import { mockShopApi, products } from "./fixtures";

const playwrightJwtSecret = "playwright-jwt-secret-with-at-least-32-characters";

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.body.scrollWidth <= window.innerWidth &&
          document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ height: 800, width: 320 });
  await mockShopApi(page);
});

test("reste utilisable sans debordement sur les pages client", async ({ page }) => {
  for (const path of ["/", "/catalogue", `/produit/${products[0].slug}`, "/contact", "/avis"]) {
    await page.goto(path);
    await expectNoHorizontalOverflow(page);
  }

  await page.goto(`/produit/${products[0].slug}`);
  await page.getByRole("button", { name: "Ajouter au panier" }).click();
  await page.goto("/panier");
  await expect(page.getByRole("heading", { name: "Panier" })).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.getByRole("link", { name: "Valider la commande" }).click();
  await expect(page.getByRole("heading", { name: "Validation commande" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("affiche correctement les outils admin sur petit ecran", async ({ baseURL, page }) => {
  process.env.ADMIN_JWT_SECRET = playwrightJwtSecret;
  const token = await createAdminSessionToken({
    adminId: "admin-mobile",
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

  await page.route("**/api/dashboard", (route) =>
    route.fulfill({
      contentType: "application/json",
      json: { orderCount: 1, recentOrders: [], revenue: 0, topProducts: [] },
    }),
  );
  await page.route("**/api/orders", (route) =>
    route.fulfill({
      contentType: "application/json",
      json: [
        {
          id: "order-mobile",
          reference: "KVN-MOBILE",
          customer: {
            address: "Adresse test",
            city: "Casablanca",
            fullName: "Client mobile",
            phone: "0600000000",
          },
          items: [],
          subtotal: 0,
          total: 0,
          status: "new",
          whatsappMessage: "Commande KVN",
          createdAt: "2026-07-26T12:00:00.000Z",
        },
      ],
    }),
  );

  await page.goto("/admin/accueil");
  await expect(page.getByRole("heading", { name: "Accueil" })).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: /Pack Real Madrid Home.*349 MAD/ }),
  ).toBeVisible();
  await expectNoHorizontalOverflow(page);

  for (const path of ["/admin/dashboard", "/admin/produits", "/admin/categories", "/admin/equipes"]) {
    await page.goto(path);
    await expectNoHorizontalOverflow(page);
  }

  await page.goto("/admin/commandes");
  await expectNoHorizontalOverflow(page);
  await expect(page.getByRole("link", { name: "Contacter Client mobile sur WhatsApp" })).toHaveAttribute(
    "href",
    "https://wa.me/212600000000?text=Commande%20KVN",
  );
});

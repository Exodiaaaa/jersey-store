import { expect, test } from "@playwright/test";
import { mockShopApi, products } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockShopApi(page);
});

test("affiche l'accueil et les produits provenant de l'API", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "KVN Footwear" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Shop now/i })).toBeVisible();
  await expect(page.getByText(products[0].name).first()).toBeVisible();
});

test("sert les photos produit stockees sans seconde compression", async ({ page }) => {
  const storedImage = "/api/product-images/test-image";
  const product = { ...products[0], images: [storedImage] };

  await page.route(/\/api\/products$/, async (route) => {
    await route.fulfill({ contentType: "application/json", json: [product] });
  });
  await page.route(/\/api\/product-images\/test-image$/, async (route) => {
    await route.fulfill({
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlGQAAAAASUVORK5CYII=",
        "base64",
      ),
      contentType: "image/png",
    });
  });

  await page.goto("/catalogue");

  const image = page.getByRole("img", { name: product.name }).first();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("src", storedImage);
});

test("filtre le catalogue par recherche", async ({ page }) => {
  await page.goto("/catalogue");

  await expect(page.getByRole("heading", { name: "Find your kit." })).toBeVisible();
  await expect(page.getByText("2 produit(s)")).toBeVisible();

  await page.getByLabel("Recherche").fill("arsenal");

  await expect(page.getByText("1 produit(s)")).toBeVisible();
  await expect(page.getByText("Maillot Arsenal Away")).toBeVisible();
  await expect(page.getByText("Pack Real Madrid Home")).toHaveCount(0);
});

test("affiche les produits sans scroll apres une categorie vide", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await page.goto("/catalogue");

  const category = page.getByLabel("Categorie");
  await category.selectOption("empty");
  await expect(page.getByText("0 produit(s)")).toBeVisible();

  await category.selectOption("jersey");
  await expect(page.getByText("1 produit(s)")).toBeVisible();

  const productCard = page.locator("article").filter({ hasText: "Maillot Arsenal Away" });
  await expect(productCard).toHaveCount(1);
  const opacity = await productCard.evaluate((element) => window.getComputedStyle(element).opacity);
  expect(opacity).toBe("1");
});

test("ajoute un produit au panier depuis une fiche produit", async ({ page }) => {
  await page.goto(`/produit/${products[0].slug}`);

  await expect(page.getByRole("heading", { name: products[0].name })).toBeVisible();

  await page.getByRole("button", { name: "Ajouter au panier" }).click();
  await page.getByRole("link", { name: "Voir le panier" }).click();

  await expect(page.getByRole("heading", { name: "Panier" })).toBeVisible();
  await expect(page.getByText(products[0].name)).toBeVisible();
  await expect(page.getByText(/349/).first()).toBeVisible();
});

test("publie un avis client sur une fiche produit", async ({ page }) => {
  await page.goto(`/produit/${products[0].slug}`);

  await expect(page.getByText("Client test")).toBeVisible();

  await page.getByLabel("Nom").fill("Imran");
  await page.getByLabel("Commentaire").fill("Tres bon pack, taille parfaite.");
  await page.getByRole("button", { name: /Publier/i }).click();

  await expect(page.getByText("Imran")).toBeVisible();
  await expect(page.getByText("Tres bon pack, taille parfaite.")).toBeVisible();
});

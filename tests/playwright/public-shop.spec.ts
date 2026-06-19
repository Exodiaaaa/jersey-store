import { expect, test } from "@playwright/test";
import { mockShopApi, products } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockShopApi(page);
});

test("affiche l'accueil et les produits provenant de l'API", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "KVN Footwear" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Voir les maillots/i })).toBeVisible();
  await expect(page.getByText(products[0].name).first()).toBeVisible();
});

test("filtre le catalogue par recherche", async ({ page }) => {
  await page.goto("/catalogue");

  await expect(page.getByRole("heading", { name: "Trouver une tenue" })).toBeVisible();
  await expect(page.getByText("2 produit(s)")).toBeVisible();

  await page.getByLabel("Recherche").fill("arsenal");

  await expect(page.getByText("1 produit(s)")).toBeVisible();
  await expect(page.getByText("Maillot Arsenal Away")).toBeVisible();
  await expect(page.getByText("Pack Real Madrid Home")).toHaveCount(0);
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

import { expect, test } from "@playwright/test";
import { adminSessionCookieName, createAdminSessionToken } from "../../src/lib/admin-jwt";
import { MAX_OPTIMIZED_IMAGE_BYTES } from "../../src/lib/product-images";
import { mockShopApi } from "./fixtures";

const playwrightJwtSecret = "playwright-jwt-secret-with-at-least-32-characters";

async function openProductCreation(page: import("@playwright/test").Page, baseURL: string | undefined) {
  process.env.ADMIN_JWT_SECRET = playwrightJwtSecret;
  const token = await createAdminSessionToken({
    adminId: "admin-images",
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
  await mockShopApi(page);
  await page.goto("/admin/produits/nouveau");
}

test("compresse une photo volumineuse avant de l'ajouter au produit", async ({ baseURL, page }) => {
  await openProductCreation(page, baseURL);

  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlGQAAAAASUVORK5CYII=",
    "base64",
  );
  const paddedPhoto = Buffer.concat([onePixelPng, Buffer.alloc(5 * 1024 * 1024)]);

  await page.locator("#product-images").setInputFiles({
    buffer: paddedPhoto,
    mimeType: "image/png",
    name: "photo-telephone.png",
  });

  const dialog = page.getByRole("dialog", { name: "Confirmer l'ajout de photos" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Ajouter" }).click();

  const preview = page.getByRole("img", { name: "Photo produit 1" });
  await expect(preview).toBeVisible();
  const style = (await preview.getAttribute("style")) ?? "";
  const encodedImage = style.match(/data:image\/[^;]+;base64,([^"]+)/)?.[1] ?? "";
  const approximateBytes = Math.floor((encodedImage.length * 3) / 4);

  expect(encodedImage.length).toBeGreaterThan(0);
  expect(approximateBytes).toBeLessThanOrEqual(MAX_OPTIMIZED_IMAGE_BYTES);
});

test("conserve sans perte une photo deja assez legere", async ({ baseURL, page }) => {
  await openProductCreation(page, baseURL);

  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlGQAAAAASUVORK5CYII=",
    "base64",
  );

  await page.locator("#product-images").setInputFiles({
    buffer: onePixelPng,
    mimeType: "image/png",
    name: "photo-originale.png",
  });

  const dialog = page.getByRole("dialog", { name: "Confirmer l'ajout de photos" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Ajouter" }).click();

  const preview = page.getByRole("img", { name: "Photo produit 1" });
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute("style", /data:image\/png;base64/);
});

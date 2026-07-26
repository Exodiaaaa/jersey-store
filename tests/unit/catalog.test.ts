import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  getAvailableProductTypes,
  getLowestAvailablePrice,
  getProductOriginalPrice,
  getProductPriceInfo,
  getUnitPrice,
} from "../../src/lib/catalog";
import { getProductSaleConfiguration, getProductSaleMode } from "../../src/lib/product-sales";
import { makeProduct } from "../helpers/fixtures";

describe("catalog helpers", () => {
  test("calcule le prix courant avec flocage seulement quand le produit l'autorise", () => {
    const product = makeProduct({ allowFlocking: true, basePrice: 249, flockingPrice: 39 });
    const productWithoutFlocking = makeProduct({ allowFlocking: false, basePrice: 249, flockingPrice: 39 });

    assert.equal(getUnitPrice(product, "jersey", true), 288);
    assert.equal(getUnitPrice(productWithoutFlocking, "jersey", true), 249);
  });

  test("expose un prix original uniquement quand il est superieur au prix courant", () => {
    const product = makeProduct({
      basePrice: 249,
      originalBasePrice: 299,
      packPrice: 349,
      originalPackPrice: 349,
    });

    assert.equal(getProductOriginalPrice(product, "jersey"), 299);
    assert.equal(getProductOriginalPrice(product, "pack"), undefined);
    assert.deepEqual(getProductPriceInfo(product, "pack"), {
      currentPrice: 349,
      originalPrice: undefined,
    });
  });

  test("utilise une seule option par defaut selon la categorie historique", () => {
    assert.deepEqual(getAvailableProductTypes(makeProduct({ categoryId: "accessory" })), ["jersey"]);
    assert.deepEqual(getAvailableProductTypes(makeProduct({ categoryId: "pack" })), ["pack"]);
    assert.deepEqual(getAvailableProductTypes(makeProduct({ categoryId: "jersey" })), ["jersey"]);
  });

  test("priorise les types reellement vendus quand ils sont configures", () => {
    assert.deepEqual(getAvailableProductTypes(makeProduct({ hasJersey: true, hasPack: false })), ["jersey"]);
    assert.deepEqual(getAvailableProductTypes(makeProduct({ hasJersey: false, hasPack: true })), ["pack"]);
    assert.deepEqual(
      getAvailableProductTypes(makeProduct({ categoryId: "pack", hasJersey: true, hasPack: true })),
      ["pack", "jersey"],
    );
  });

  test("derive les drapeaux et la categorie depuis le mode de vente unique", () => {
    assert.equal(getProductSaleMode(makeProduct({ hasJersey: true, hasPack: true })), "both");
    assert.deepEqual(getProductSaleConfiguration("pack"), {
      categoryId: "pack",
      hasJersey: false,
      hasPack: true,
      label: "Pack maillot + short uniquement",
    });
  });

  test("affiche le prix reel le plus bas selon le mode de vente", () => {
    assert.equal(
      getLowestAvailablePrice(makeProduct({ basePrice: 249, hasJersey: false, hasPack: true, packPrice: 349 })),
      349,
    );
    assert.equal(
      getLowestAvailablePrice(makeProduct({ basePrice: 249, hasJersey: true, hasPack: true, packPrice: 349 })),
      249,
    );
  });
});

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  getAvailableProductTypes,
  getProductOriginalPrice,
  getProductPriceInfo,
  getUnitPrice,
} from "../../src/lib/catalog";
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

  test("limite les types disponibles selon la categorie", () => {
    assert.deepEqual(getAvailableProductTypes(makeProduct({ categoryId: "accessory" })), ["jersey"]);
    assert.deepEqual(getAvailableProductTypes(makeProduct({ categoryId: "pack" })), ["pack", "jersey"]);
    assert.deepEqual(getAvailableProductTypes(makeProduct({ categoryId: "jersey" })), ["jersey", "pack"]);
  });
});

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  dataUrlPayloadBytes,
  isSupportedProductImageType,
  jsonByteLength,
  MAX_PRODUCT_IMAGES,
  MAX_PRODUCT_REQUEST_BYTES,
  validateProductImages,
  validateProductRequestSize,
} from "../../src/lib/product-images";

describe("product image limits", () => {
  test("accepte les formats d'image geres par le formulaire", () => {
    assert.equal(isSupportedProductImageType("image/jpeg"), true);
    assert.equal(isSupportedProductImageType("image/png"), true);
    assert.equal(isSupportedProductImageType("image/webp"), true);
    assert.equal(isSupportedProductImageType("image/svg+xml"), false);
  });

  test("calcule la taille binaire d'une image Base64", () => {
    assert.equal(dataUrlPayloadBytes("data:image/webp;base64,SGVsbG8="), 5);
    assert.equal(dataUrlPayloadBytes("/products/example.webp"), 0);
  });

  test("refuse plus de huit photos et les formats dangereux", () => {
    assert.deepEqual(validateProductImages(Array.from({ length: MAX_PRODUCT_IMAGES + 1 }, () => "/photo.webp")), {
      message: `Un produit ne peut pas contenir plus de ${MAX_PRODUCT_IMAGES} photos.`,
      ok: false,
      status: 400,
    });
    assert.deepEqual(validateProductImages(["data:image/svg+xml;base64,PHN2Zz4="]), {
      message: "Les photos doivent etre au format JPG, PNG ou WEBP.",
      ok: false,
      status: 400,
    });
  });

  test("mesure le JSON en octets UTF-8", () => {
    assert.equal(jsonByteLength({ label: "été" }), Buffer.byteLength(JSON.stringify({ label: "été" })));
  });

  test("refuse une requete annoncee au-dessus de la limite avant de lire son corps", () => {
    const request = new Request("http://localhost/api/products", {
      headers: { "content-length": String(MAX_PRODUCT_REQUEST_BYTES + 1) },
      method: "POST",
    });
    const result = validateProductRequestSize(request);

    assert.equal(result?.status, 413);
    assert.match(result?.message ?? "", /trop volumineuses/i);
  });
});

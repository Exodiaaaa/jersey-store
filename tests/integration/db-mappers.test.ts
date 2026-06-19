import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { mapDbHomeSection, mapDbOrder, mapDbProduct } from "../../src/lib/db-mappers";
import { makeDbOrder, makeDbProduct } from "../helpers/fixtures";

describe("db mappers", () => {
  test("mappe un produit DB en triant les images et les tailles", () => {
    const product = mapDbProduct(
      makeDbProduct({
        visualPattern: "unknown-pattern",
        images: [
          { url: "/second.jpeg", sortOrder: 2 },
          { url: "/first.jpeg", sortOrder: 1 },
        ],
        stocks: [
          { size: "XL", quantity: 1 },
          { size: "S", quantity: 4 },
          { size: "M", quantity: 3 },
        ],
      }),
    );

    assert.deepEqual(product.images, ["/first.jpeg", "/second.jpeg"]);
    assert.deepEqual(product.sizes, ["S", "M", "XL"]);
    assert.equal(product.stock.S, 4);
    assert.equal(product.visual.pattern, "clean");
    assert.equal(product.createdAt, "2026-04-16T12:00:00.000Z");
  });

  test("mappe les commandes et remplace un statut inconnu par new", () => {
    const order = mapDbOrder(makeDbOrder({ status: "archived" }));

    assert.equal(order.status, "new");
    assert.equal(order.customer.fullName, "Imran Test");
    assert.equal(order.items[0].lineTotal, 698);
    assert.equal(order.items[0].flocking.name, undefined);
  });

  test("mappe une section d'accueil en conservant l'ordre configure des produits", () => {
    const section = mapDbHomeSection({
      id: "home-1",
      title: "Selection",
      subtitle: null,
      isActive: true,
      sortOrder: 1,
      createdAt: new Date("2026-04-16T12:00:00.000Z"),
      products: [
        { productId: "prod-2", sortOrder: 2, product: makeDbProduct({ id: "prod-2" }) },
        { productId: "prod-1", sortOrder: 1, product: makeDbProduct({ id: "prod-1" }) },
      ],
    });

    assert.deepEqual(section.productIds, ["prod-1", "prod-2"]);
    assert.deepEqual(section.products.map((product: { id: string }) => product.id), ["prod-1", "prod-2"]);
    assert.equal(section.subtitle, undefined);
  });
});

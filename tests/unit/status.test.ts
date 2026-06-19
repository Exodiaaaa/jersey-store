import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { canChangeOrderStatus } from "../../src/lib/status";

describe("order status flow", () => {
  test("autorise la progression vers l'avant et le maintien du meme statut", () => {
    assert.equal(canChangeOrderStatus("new", "new"), true);
    assert.equal(canChangeOrderStatus("new", "confirmed"), true);
    assert.equal(canChangeOrderStatus("confirmed", "ready"), true);
  });

  test("bloque les retours en arriere et les commandes finales", () => {
    assert.equal(canChangeOrderStatus("ready", "preparing"), false);
    assert.equal(canChangeOrderStatus("delivered", "cancelled"), false);
    assert.equal(canChangeOrderStatus("cancelled", "new"), false);
  });

  test("autorise l'annulation tant que la commande n'est pas finale", () => {
    assert.equal(canChangeOrderStatus("new", "cancelled"), true);
    assert.equal(canChangeOrderStatus("preparing", "cancelled"), true);
  });
});

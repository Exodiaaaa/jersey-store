import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { createOrder, getDashboardStats, getOrders, updateOrderStatus } from "../../src/lib/orders";
import { makeCartItem, makeCustomer } from "../helpers/fixtures";

type StoredWindow = {
  localStorage: {
    clear(): void;
    getItem(key: string): string | null;
    removeItem(key: string): void;
    setItem(key: string, value: string): void;
  };
};

function installStorageWindow() {
  const store = new Map<string, string>();
  const fakeWindow: StoredWindow = {
    localStorage: {
      clear() {
        store.clear();
      },
      getItem(key: string) {
        return store.get(key) ?? null;
      },
      removeItem(key: string) {
        store.delete(key);
      },
      setItem(key: string, value: string) {
        store.set(key, value);
      },
    },
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: fakeWindow,
  });

  return fakeWindow;
}

describe("orders local storage flow", () => {
  let fakeWindow: StoredWindow;

  beforeEach(() => {
    fakeWindow = installStorageWindow();
  });

  afterEach(() => {
    fakeWindow.localStorage.clear();
    delete (globalThis as { window?: unknown }).window;
  });

  test("cree une commande, calcule les totaux et persiste la derniere commande", () => {
    const order = createOrder(
      [
        makeCartItem({ id: "cart-1", quantity: 2, unitPrice: 349 }),
        makeCartItem({ id: "cart-2", productName: "Maillot Arsenal", quantity: 1, unitPrice: 229 }),
      ],
      makeCustomer(),
    );

    assert.equal(order.subtotal, 927);
    assert.equal(order.total, 927);
    assert.equal(order.items[0].lineTotal, 698);
    assert.match(order.reference, /^JS-\d{4}-\d{5}$/);
    assert.equal(getOrders()[0].id, order.id);

    const lastOrder = JSON.parse(fakeWindow.localStorage.getItem("jersey-store.last-order") ?? "{}");
    assert.equal(lastOrder.id, order.id);
  });

  test("les statistiques excluent le revenu et les tops des commandes annulees", async () => {
    const active = createOrder([makeCartItem({ productName: "Pack Real Madrid", quantity: 2 })], makeCustomer());
    await delay(2);
    const cancelled = createOrder([makeCartItem({ productName: "Maillot Arsenal", quantity: 5 })], makeCustomer());

    updateOrderStatus(cancelled.id, "cancelled");
    const stats = getDashboardStats();

    assert.equal(stats.orderCount, 2);
    assert.equal(stats.estimatedRevenue, active.total);
    assert.deepEqual(stats.topProducts, [{ name: "Pack Real Madrid", quantity: 2 }]);
  });
});

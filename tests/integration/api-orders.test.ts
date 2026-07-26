import assert from "node:assert/strict";
import { before, beforeEach, describe, test } from "node:test";
import { adminSessionCookieName, createAdminSessionToken } from "../../src/lib/admin-session";

import { makeCartItem, makeCustomer, makeDbOrder, makeDbOrderItem } from "../helpers/fixtures";

type StockUpdateCall = {
  data: Record<string, unknown>;
  where: Record<string, unknown>;
};

const state = {
  currentOrder: makeDbOrder(),
  createdOrderPayload: undefined as Record<string, unknown> | undefined,
  stockCount: 1,
  stockUpdates: [] as StockUpdateCall[],
  updatedStatus: undefined as string | undefined,
};

function toDbOrderItems(items: Array<Record<string, unknown>>) {
  return items.map((item) =>
    makeDbOrderItem({
      cartItemId: item.id,
      productId: item.productId,
      productName: item.productName,
      teamName: item.teamName,
      size: item.size,
      type: item.type,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      flockingMode: item.flockingMode,
      flockingName: item.flockingName ?? null,
      flockingNumber: item.flockingNumber ?? null,
      flockingPlayer: item.flockingPlayer ?? null,
      flockingNote: item.flockingNote ?? null,
      visualPrimary: item.visualPrimary,
      visualSecondary: item.visualSecondary,
      visualTrim: item.visualTrim,
      visualPattern: item.visualPattern,
      image: item.image ?? null,
    }),
  );
}

const fakePrisma = {
  order: {
    async findUnique() {
      return state.currentOrder;
    },
  },
  async $transaction(callback: (tx: unknown) => Promise<unknown>) {
    const tx = {
      order: {
        async create({ data }: { data: Record<string, unknown> }) {
          state.createdOrderPayload = data;
          const createdItems = (data.items as { create: Array<Record<string, unknown>> }).create;

          return makeDbOrder({
            customerAddress: data.customerAddress,
            customerCity: data.customerCity,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            id: data.id,
            items: toDbOrderItems(createdItems),
            reference: data.reference,
            subtotal: data.subtotal,
            total: data.total,
            whatsappMessage: data.whatsappMessage,
          });
        },
        async update({ data }: { data: { status: string } }) {
          state.updatedStatus = data.status;

          return makeDbOrder({
            ...state.currentOrder,
            status: data.status,
          });
        },
      },
      productStock: {
        async updateMany(call: StockUpdateCall) {
          state.stockUpdates.push(call);
          return { count: state.stockCount };
        },
      },
    };

    return callback(tx);
  },
};

(globalThis as { prisma?: unknown }).prisma = fakePrisma;

type OrdersRouteModule = {
  POST(request: Request): Promise<Response>;
};

type StatusRouteModule = {
  PATCH(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response>;
};

let ordersRoute: OrdersRouteModule;
let statusRoute: StatusRouteModule;
let adminCookie = "";

function unwrapModule<T extends object>(module: T | { default: T }) {
  return "default" in module ? module.default : module;
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/orders", {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

function authenticatedJsonRequest(body: unknown) {
  return new Request("http://localhost/api/orders/order-1/status", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      cookie: adminCookie,
    },
    method: "PATCH",
  });
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("orders API route handlers", () => {
  before(async () => {
    process.env.ADMIN_EMAIL = "admin@example.test";
    process.env.ADMIN_PASSWORD = "test-password";
    process.env.ADMIN_SESSION_SECRET = "test-session-secret-with-at-least-32-characters";
    adminCookie = `${adminSessionCookieName}=${createAdminSessionToken()}`;
    ordersRoute = unwrapModule(await import("../../src/app/api/orders/route"));
    statusRoute = unwrapModule(await import("../../src/app/api/orders/[id]/status/route"));
  });

  beforeEach(() => {
    state.currentOrder = makeDbOrder();
    state.createdOrderPayload = undefined;
    state.stockCount = 1;
    state.stockUpdates = [];
    state.updatedStatus = undefined;
  });

  test("POST cree une commande et regroupe les decrements de stock par produit et taille", async () => {
    const items = [
      makeCartItem({ id: "cart-1", productId: "prod-real-home", quantity: 1, size: "M" }),
      makeCartItem({ id: "cart-2", productId: "prod-real-home", quantity: 2, size: "M" }),
    ];
    const response = await ordersRoute.POST(jsonRequest({ customer: makeCustomer(), items }));
    const body = await responseJson(response);

    assert.equal(response.status, 201);
    assert.equal(body.total, 1047);
    assert.equal((body.items as unknown[]).length, 2);
    assert.equal(state.stockUpdates.length, 1);
    assert.deepEqual(state.stockUpdates[0].data, { quantity: { decrement: 3 } });
    assert.deepEqual(state.stockUpdates[0].where, {
      productId: "prod-real-home",
      quantity: { gte: 3 },
      size: "M",
    });
    assert.equal(state.createdOrderPayload?.status, "new");
  });

  test("POST retourne 409 quand le stock est insuffisant", async () => {
    state.stockCount = 0;

    const response = await ordersRoute.POST(
      jsonRequest({ customer: makeCustomer(), items: [makeCartItem({ quantity: 4 })] }),
    );
    const body = await responseJson(response);

    assert.equal(response.status, 409);
    assert.equal(body.message, "Stock insuffisant pour Pack Real Madrid Home en taille M.");
  });

  test("PATCH refuse un statut invalide avant toute ecriture", async () => {
    const response = await statusRoute.PATCH(authenticatedJsonRequest({ status: "archived" }), {
      params: Promise.resolve({ id: "order-1" }),
    });
    const body = await responseJson(response);

    assert.equal(response.status, 400);
    assert.equal(body.message, "Invalid order status");
    assert.equal(state.updatedStatus, undefined);
  });

  test("PATCH bloque un retour en arriere", async () => {
    state.currentOrder = makeDbOrder({ status: "preparing" });

    const response = await statusRoute.PATCH(authenticatedJsonRequest({ status: "confirmed" }), {
      params: Promise.resolve({ id: "order-1" }),
    });
    const body = await responseJson(response);

    assert.equal(response.status, 409);
    assert.equal(body.message, "Order status cannot move backwards");
  });

  test("PATCH cancellation restaure le stock par produit et taille", async () => {
    state.currentOrder = makeDbOrder({
      items: [
        makeDbOrderItem({ productId: "prod-real-home", quantity: 1, size: "M" }),
        makeDbOrderItem({ productId: "prod-real-home", quantity: 2, size: "M" }),
      ],
      status: "preparing",
    });

    const response = await statusRoute.PATCH(authenticatedJsonRequest({ status: "cancelled" }), {
      params: Promise.resolve({ id: "order-1" }),
    });
    const body = await responseJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.status, "cancelled");
    assert.equal(state.updatedStatus, "cancelled");
    assert.equal(state.stockUpdates.length, 1);
    assert.deepEqual(state.stockUpdates[0].data, { quantity: { increment: 3 } });
    assert.deepEqual(state.stockUpdates[0].where, { productId: "prod-real-home", size: "M" });
  });

  test("PATCH refuse une requete sans session admin", async () => {
    const response = await statusRoute.PATCH(jsonRequest({ status: "confirmed" }), {
      params: Promise.resolve({ id: "order-1" }),
    });

    assert.equal(response.status, 401);
    assert.equal(state.updatedStatus, undefined);
  });
});

"use client";

import { readStorage, writeStorage } from "@/lib/storage";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { CartItem, Customer, DashboardStats, Order, OrderStatus } from "@/lib/types";

const ORDERS_KEY = "jersey-store.orders";

export function getOrders() {
  return readStorage<Order[]>(ORDERS_KEY, []);
}

export function getOrderById(id: string) {
  return getOrders().find((order) => order.id === id);
}

export function createOrder(items: CartItem[], customer: Customer) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const now = new Date();
  const id = `order-${now.getTime()}`;
  const reference = `JS-${now.getFullYear()}-${String(now.getTime()).slice(-5)}`;
  const orderItems = items.map((item) => ({
    ...item,
    lineTotal: item.unitPrice * item.quantity,
  }));
  const message = buildWhatsAppMessage(items, customer, subtotal);

  const order: Order = {
    id,
    reference,
    customer,
    items: orderItems,
    subtotal,
    total: subtotal,
    status: "new",
    createdAt: now.toISOString(),
    whatsappMessage: message,
  };

  writeStorage(ORDERS_KEY, [order, ...getOrders()]);
  writeStorage("jersey-store.last-order", order);
  return order;
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const updated = getOrders().map((order) => (order.id === orderId ? { ...order, status } : order));
  writeStorage(ORDERS_KEY, updated);
  return updated.find((order) => order.id === orderId);
}

export function getDashboardStats(): DashboardStats {
  const orders = getOrders();
  const productMap = new Map<string, number>();

  orders.forEach((order) => {
    if (order.status !== "cancelled") {
      order.items.forEach((item) => {
        productMap.set(item.productName, (productMap.get(item.productName) ?? 0) + item.quantity);
      });
    }
  });

  return {
    orderCount: orders.length,
    estimatedRevenue: orders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0),
    topProducts: Array.from(productMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
    recentOrders: orders.slice(0, 5),
  };
}

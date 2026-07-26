import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { mapDbOrder } from "@/lib/db-mappers";

export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const orders = await prisma.order.findMany({
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const mappedOrders = orders.map(mapDbOrder);
  const productMap = new Map<string, number>();

  mappedOrders.forEach((order) => {
    if (order.status !== "cancelled") {
      order.items.forEach((item) => {
        productMap.set(item.productName, (productMap.get(item.productName) ?? 0) + item.quantity);
      });
    }
  });

  return NextResponse.json({
    orderCount: mappedOrders.length,
    estimatedRevenue: mappedOrders
      .filter((order) => order.status !== "cancelled")
      .reduce((sum, order) => sum + order.total, 0),
    topProducts: Array.from(productMap.entries())
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
    recentOrders: mappedOrders.slice(0, 5),
  });
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { mapDbOrder } from "@/lib/db-mappers";
import { canChangeOrderStatus, orderStatuses } from "@/lib/status";
import { OrderStatus } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const body = (await request.json()) as { status: OrderStatus };

  if (!orderStatuses.includes(body.status)) {
    return NextResponse.json({ message: "Invalid order status" }, { status: 400 });
  }

  const currentOrder = await prisma.order.findUnique({
    include: { items: true },
    where: { id },
  });

  if (!currentOrder) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  if (!canChangeOrderStatus(currentOrder.status as OrderStatus, body.status)) {
    return NextResponse.json({ message: "Order status cannot move backwards" }, { status: 409 });
  }

  const order = await prisma.$transaction(async (tx) => {
    if (body.status === "cancelled") {
      const quantitiesByProductSize = new Map<string, { productId: string; quantity: number; size: string }>();

      currentOrder.items.forEach((item) => {
        const key = `${item.productId}|${item.size}`;
        const current = quantitiesByProductSize.get(key);
        quantitiesByProductSize.set(key, {
          productId: item.productId,
          quantity: (current?.quantity ?? 0) + item.quantity,
          size: item.size,
        });
      });

      for (const item of quantitiesByProductSize.values()) {
        await tx.productStock.updateMany({
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
          where: {
            productId: item.productId,
            size: item.size,
          },
        });
      }
    }

    return tx.order.update({
      data: { status: body.status },
      include: {
        items: true,
      },
      where: { id },
    });
  });

  return NextResponse.json(mapDbOrder(order));
}

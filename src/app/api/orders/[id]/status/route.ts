import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapDbOrder } from "@/lib/db-mappers";
import { canChangeOrderStatus, orderStatuses } from "@/lib/status";
import { OrderStatus } from "@/lib/types";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as { status: OrderStatus };

  if (!orderStatuses.includes(body.status)) {
    return NextResponse.json({ message: "Invalid order status" }, { status: 400 });
  }

  const currentOrder = await prisma.order.findUnique({
    select: { status: true },
    where: { id },
  });

  if (!currentOrder) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  if (!canChangeOrderStatus(currentOrder.status as OrderStatus, body.status)) {
    return NextResponse.json({ message: "Order status cannot move backwards" }, { status: 409 });
  }

  const order = await prisma.order.update({
    data: { status: body.status },
    include: {
      items: true,
    },
    where: { id },
  });

  return NextResponse.json(mapDbOrder(order));
}

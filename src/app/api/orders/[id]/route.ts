import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapDbOrder } from "@/lib/db-mappers";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    include: {
      items: true,
    },
    where: { id },
  });

  if (!order) {
    return NextResponse.json({ message: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(mapDbOrder(order));
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapDbOrder } from "@/lib/db-mappers";
import { buildWhatsAppMessage } from "@/lib/whatsapp";
import { CartItem, Customer } from "@/lib/types";

const orderInclude = {
  items: true,
};

export async function GET() {
  const orders = await prisma.order.findMany({
    include: orderInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders.map(mapDbOrder));
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    items: CartItem[];
    customer: Customer;
  };
  const subtotal = body.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const now = new Date();
  const id = `order-${now.getTime()}`;
  const reference = `KVN-${now.getFullYear()}-${String(now.getTime()).slice(-5)}`;
  const whatsappMessage = buildWhatsAppMessage(body.items, body.customer, subtotal);

  const order = await prisma.order.create({
    data: {
      id,
      reference,
      customerName: body.customer.fullName,
      customerPhone: body.customer.phone,
      customerCity: body.customer.city,
      customerAddress: body.customer.address,
      subtotal,
      total: subtotal,
      status: "new",
      whatsappMessage,
      items: {
        create: body.items.map((item) => ({
          cartItemId: item.id,
          productId: item.productId,
          productName: item.productName,
          teamName: item.teamName,
          size: item.size,
          type: item.type,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.unitPrice * item.quantity,
          flockingMode: item.flocking.mode,
          flockingName: item.flocking.name,
          flockingNumber: item.flocking.number,
          flockingPlayer: item.flocking.player,
          flockingNote: item.flocking.note,
          visualPrimary: item.visual.primary,
          visualSecondary: item.visual.secondary,
          visualTrim: item.visual.trim,
          visualPattern: item.visual.pattern,
          image: item.image,
        })),
      },
    },
    include: orderInclude,
  });

  return NextResponse.json(mapDbOrder(order), { status: 201 });
}

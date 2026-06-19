import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapDbProduct } from "@/lib/db-mappers";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    include: {
      category: true,
      images: true,
      stocks: true,
      team: true,
    },
    where: { slug },
  });

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(mapDbProduct(product));
}

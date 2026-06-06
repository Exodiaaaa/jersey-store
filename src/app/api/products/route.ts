import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapDbProduct } from "@/lib/db-mappers";
import { Product } from "@/lib/types";

const productInclude = {
  images: true,
  stocks: true,
};

function productPayload(product: Product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    teamId: product.teamId,
    categoryId: product.categoryId,
    basePrice: product.basePrice,
    packPrice: product.packPrice,
    flockingPrice: product.flockingPrice,
    description: product.description,
    visualPrimary: product.visual.primary,
    visualSecondary: product.visual.secondary,
    visualTrim: product.visual.trim,
    visualPattern: product.visual.pattern,
    isNew: product.isNew,
    isPopular: product.isPopular,
    allowFlocking: product.allowFlocking,
  };
}

export async function GET() {
  const products = await prisma.product.findMany({
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products.map(mapDbProduct));
}

export async function POST(request: Request) {
  const product = (await request.json()) as Product;

  const savedProduct = await prisma.$transaction(async (tx) => {
    await tx.product.create({
      data: productPayload(product),
    });
    await tx.productImage.createMany({
      data: product.images.map((url, index) => ({
        productId: product.id,
        url,
        sortOrder: index,
      })),
    });
    await tx.productStock.createMany({
      data: product.sizes.map((size) => ({
        productId: product.id,
        size,
        quantity: product.stock[size],
      })),
    });

    return tx.product.findUniqueOrThrow({
      include: productInclude,
      where: { id: product.id },
    });
  });

  return NextResponse.json(mapDbProduct(savedProduct), { status: 201 });
}

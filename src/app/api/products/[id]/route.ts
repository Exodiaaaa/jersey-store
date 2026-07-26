import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { mapDbProduct } from "@/lib/db-mappers";
import { Product } from "@/lib/types";
import { getProductSaleConfiguration, getProductSaleMode } from "@/lib/product-sales";

const productInclude = {
  category: true,
  images: true,
  stocks: true,
  team: true,
};

function productPayload(product: Product) {
  const sales = getProductSaleConfiguration(getProductSaleMode(product));

  return {
    slug: product.slug,
    name: product.name,
    teamId: product.teamId,
    categoryId: sales.categoryId,
    basePrice: product.basePrice,
    packPrice: product.packPrice,
    originalBasePrice: product.originalBasePrice ?? null,
    originalPackPrice: product.originalPackPrice ?? null,
    hasJersey: sales.hasJersey,
    hasPack: sales.hasPack,
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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    include: productInclude,
    where: { id },
  });

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json(mapDbProduct(product));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const product = (await request.json()) as Product;

  const savedProduct = await prisma.$transaction(async (tx) => {
    await tx.product.update({
      data: productPayload(product),
      where: { id },
    });
    await tx.productImage.deleteMany({ where: { productId: id } });
    await tx.productStock.deleteMany({ where: { productId: id } });
    await tx.productImage.createMany({
      data: product.images.map((url, index) => ({
        productId: id,
        url,
        sortOrder: index,
      })),
    });
    await tx.productStock.createMany({
      data: product.sizes.map((size) => ({
        productId: id,
        size,
        quantity: product.stock[size],
      })),
    });

    return tx.product.findUniqueOrThrow({
      include: productInclude,
      where: { id },
    });
  });

  return NextResponse.json(mapDbProduct(savedProduct));
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  await prisma.product.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { mapDbHomeSection } from "@/lib/db-mappers";
import { HomeSectionInput } from "@/lib/types";

const productInclude = {
  category: true,
  images: true,
  stocks: true,
  team: true,
};

const homeSectionInclude = {
  products: {
    include: {
      product: {
        include: productInclude,
      },
    },
    orderBy: { sortOrder: "asc" as const },
  },
};

function uniqueProductIds(productIds: string[]) {
  return Array.from(new Set(productIds.filter(Boolean)));
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const section = (await request.json()) as HomeSectionInput;
  const productIds = uniqueProductIds(section.productIds ?? []);

  const savedSection = await prisma.$transaction(async (tx) => {
    await tx.homeSection.update({
      data: {
        isActive: section.isActive,
        sortOrder: section.sortOrder,
        subtitle: section.subtitle?.trim() || null,
        title: section.title.trim(),
      },
      where: { id },
    });

    await tx.homeSectionProduct.deleteMany({ where: { sectionId: id } });

    if (productIds.length > 0) {
      await tx.homeSectionProduct.createMany({
        data: productIds.map((productId, index) => ({
          productId,
          sectionId: id,
          sortOrder: index,
        })),
      });
    }

    return tx.homeSection.findUniqueOrThrow({
      include: homeSectionInclude,
      where: { id },
    });
  });

  return NextResponse.json(mapDbHomeSection(savedSection));
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  await prisma.homeSection.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

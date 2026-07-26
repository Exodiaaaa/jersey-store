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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueProductIds(productIds: string[]) {
  return Array.from(new Set(productIds.filter(Boolean)));
}

async function createSectionId(title: string) {
  const baseId = slugify(title) || `section-${Date.now()}`;
  const existingSection = await prisma.homeSection.findUnique({ where: { id: baseId } });

  return existingSection ? `${baseId}-${Date.now()}` : baseId;
}

export async function GET() {
  const sections = await prisma.homeSection.findMany({
    include: homeSectionInclude,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(sections.map(mapDbHomeSection));
}

export async function POST(request: Request) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const section = (await request.json()) as HomeSectionInput;
  const productIds = uniqueProductIds(section.productIds ?? []);
  const id = section.id || (await createSectionId(section.title));

  const savedSection = await prisma.$transaction(async (tx) => {
    await tx.homeSection.create({
      data: {
        id,
        isActive: section.isActive,
        sortOrder: section.sortOrder,
        subtitle: section.subtitle?.trim() || null,
        title: section.title.trim(),
      },
    });

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

  return NextResponse.json(mapDbHomeSection(savedSection), { status: 201 });
}

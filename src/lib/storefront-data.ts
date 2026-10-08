import "server-only";
import { mapDbHomeSectionSummary, mapDbProductSummary } from "@/lib/db-mappers";
import { prisma } from "@/lib/prisma";

export const productSummaryInclude = {
  category: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
    select: { id: true, sortOrder: true },
    take: 1,
  },
  stocks: true,
  team: true,
};

export async function getStorefrontProducts() {
  const products = await prisma.product.findMany({
    include: productSummaryInclude,
    orderBy: { createdAt: "desc" },
  });

  return products.map(mapDbProductSummary);
}

export async function getStorefrontHomeSections() {
  const sections = await prisma.homeSection.findMany({
    include: {
      products: {
        include: {
          product: {
            include: productSummaryInclude,
          },
        },
        orderBy: { sortOrder: "asc" as const },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return sections.map(mapDbHomeSectionSummary);
}

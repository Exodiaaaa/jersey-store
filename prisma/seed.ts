import { PrismaClient } from "@prisma/client";
import { categories, products, sizes, teams } from "../src/data/catalog";
import { getProductSaleConfiguration, getProductSaleMode } from "../src/lib/product-sales";

const prisma = new PrismaClient();

const reviews = [
  {
    productId: "prod-barca-away-26",
    customerName: "Yassine",
    rating: 5,
    comment: "Qualite top, le pack rend encore mieux en vrai.",
  },
  {
    productId: "prod-real-home-26",
    customerName: "Mehdi",
    rating: 5,
    comment: "Commande recue rapidement, flocage propre.",
  },
  {
    productId: "prod-arsenal-home-red",
    customerName: "Imane",
    rating: 4,
    comment: "Belle matiere et taille correcte. Je recommande.",
  },
];

const defaultHomeSections = [
  {
    id: "home-maillots",
    title: "MAILLOTS",
    subtitle: "Les maillots les plus demandes.",
    isActive: true,
    sortOrder: 1,
    productIds: products.filter((product) => product.categoryId === "jersey").map((product) => product.id),
  },
  {
    id: "home-ensembles",
    title: "ENSEMBLES",
    subtitle: "Packs maillot + short prets a commander.",
    isActive: true,
    sortOrder: 2,
    productIds: products.filter((product) => product.categoryId === "pack").map((product) => product.id),
  },
  {
    id: "home-nouveautes",
    title: "NOUVELLE COLLECTION",
    subtitle: "Les derniers arrivages disponibles.",
    isActive: true,
    sortOrder: 3,
    productIds: products.filter((product) => product.isNew).map((product) => product.id),
  },
  {
    id: "home-selection-2026",
    title: "SELECTIONS 2026",
    subtitle: "Tenues fortes pour les grandes competitions.",
    isActive: true,
    sortOrder: 4,
    productIds: products
      .filter((product) => product.teamId === "mexico" || product.name.toLowerCase().includes("mexique"))
      .concat(products.filter((product) => product.isPopular))
      .filter((product, index, current) => current.findIndex((item) => item.id === product.id) === index)
      .map((product) => product.id),
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      create: category,
      update: {},
      where: { id: category.id },
    });
  }

  for (const team of teams) {
    await prisma.team.upsert({
      create: team,
      update: {},
      where: { id: team.id },
    });
  }

  for (const size of sizes) {
    await prisma.sizeOption.upsert({
      create: { id: size },
      update: { id: size },
      where: { id: size },
    });
  }

  for (const product of products) {
    const existingProduct = await prisma.product.findUnique({
      select: { id: true },
      where: { id: product.id },
    });

    if (existingProduct) {
      continue;
    }

    const sales = getProductSaleConfiguration(getProductSaleMode(product));

    await prisma.product.create({
      data: {
        id: product.id,
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
        createdAt: new Date(product.createdAt),
      },
    });

    if (product.images.length > 0) {
      await prisma.productImage.createMany({
        data: product.images.map((url, index) => ({
          productId: product.id,
          url,
          sortOrder: index,
        })),
      });
    }

    await prisma.productStock.createMany({
      data: product.sizes.map((size) => ({
        productId: product.id,
        size,
        quantity: product.stock[size],
      })),
    });
  }

  for (const review of reviews) {
    const existingReviewCount = await prisma.productReview.count({
      where: {
        productId: review.productId,
        customerName: review.customerName,
        comment: review.comment,
      },
    });

    if (existingReviewCount === 0) {
      await prisma.productReview.create({ data: review });
    }
  }

  for (const section of defaultHomeSections) {
    const existingSection = await prisma.homeSection.findUnique({
      select: { id: true },
      where: { id: section.id },
    });

    if (existingSection) {
      continue;
    }

    await prisma.homeSection.create({
      data: {
        id: section.id,
        isActive: section.isActive,
        sortOrder: section.sortOrder,
        subtitle: section.subtitle,
        title: section.title,
      },
    });

    if (section.productIds.length > 0) {
      await prisma.homeSectionProduct.createMany({
        data: section.productIds.map((productId, index) => ({
          productId,
          sectionId: section.id,
          sortOrder: index,
        })),
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

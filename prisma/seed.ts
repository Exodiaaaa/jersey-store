import { PrismaClient } from "@prisma/client";
import { categories, products, sizes, teams } from "../src/data/catalog";

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
      update: category,
      where: { id: category.id },
    });
  }

  for (const team of teams) {
    await prisma.team.upsert({
      create: team,
      update: team,
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

  await prisma.product.deleteMany({
    where: {
      id: {
        notIn: products.map((product) => product.id),
      },
    },
  });

  await prisma.team.deleteMany({
    where: {
      id: {
        notIn: teams.map((team) => team.id),
      },
    },
  });

  for (const product of products) {
    await prisma.product.upsert({
      create: {
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
        createdAt: new Date(product.createdAt),
      },
      update: {
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
      },
      where: { id: product.id },
    });

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    if (product.images.length > 0) {
      await prisma.productImage.createMany({
        data: product.images.map((url, index) => ({
          productId: product.id,
          url,
          sortOrder: index,
        })),
      });
    }

    await prisma.productStock.deleteMany({ where: { productId: product.id } });
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
    await prisma.homeSection.upsert({
      create: {
        id: section.id,
        isActive: section.isActive,
        sortOrder: section.sortOrder,
        subtitle: section.subtitle,
        title: section.title,
      },
      update: {
        isActive: section.isActive,
        sortOrder: section.sortOrder,
        subtitle: section.subtitle,
        title: section.title,
      },
      where: { id: section.id },
    });

    await prisma.homeSectionProduct.deleteMany({ where: { sectionId: section.id } });
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

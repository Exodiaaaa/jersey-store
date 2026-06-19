import type { Page, Route } from "@playwright/test";
import type { Category, Product, ProductReview, Size, Team } from "../../src/lib/types";

const sizes: Size[] = ["S", "M", "L", "XL"];

export const products: Product[] = [
  {
    id: "prod-real-home",
    slug: "pack-real-madrid-home",
    name: "Pack Real Madrid Home",
    teamId: "real-madrid",
    teamName: "Real Madrid",
    teamLeague: "LaLiga",
    categoryId: "pack",
    categoryName: "Pack maillot + short",
    basePrice: 249,
    packPrice: 349,
    originalBasePrice: 299,
    originalPackPrice: 399,
    flockingPrice: 39,
    description: "Pack blanc avec short assorti.",
    sizes,
    stock: { S: 4, M: 3, L: 2, XL: 1, XXL: 0, XXXL: 0 },
    images: ["/products/real-madrid-home-pack.jpeg"],
    visual: {
      primary: "#ffffff",
      secondary: "#111111",
      trim: "#d4af37",
      pattern: "clean",
    },
    isNew: true,
    isPopular: true,
    allowFlocking: true,
    createdAt: "2026-04-16T00:00:00.000Z",
  },
  {
    id: "prod-arsenal-away",
    slug: "maillot-arsenal-away",
    name: "Maillot Arsenal Away",
    teamId: "arsenal",
    teamName: "Arsenal",
    teamLeague: "Premier League",
    categoryId: "jersey",
    categoryName: "Maillot seul",
    basePrice: 229,
    packPrice: 309,
    flockingPrice: 39,
    description: "Maillot blanc avec accents bordeaux.",
    sizes,
    stock: { S: 2, M: 5, L: 3, XL: 1, XXL: 0, XXXL: 0 },
    images: ["/products/arsenal-away-white.jpeg"],
    visual: {
      primary: "#f8fafc",
      secondary: "#7f1d1d",
      trim: "#d4af37",
      pattern: "clean",
    },
    isNew: true,
    isPopular: false,
    allowFlocking: true,
    createdAt: "2026-04-17T00:00:00.000Z",
  },
];

const categories: Category[] = [
  {
    id: "jersey",
    name: "Maillot seul",
    description: "Maillots premium avec coupe sportive.",
  },
  {
    id: "pack",
    name: "Pack maillot + short",
    description: "Ensemble complet pret pour match ou sortie.",
  },
];

const teams: Team[] = [
  {
    id: "real-madrid",
    name: "Real Madrid",
    league: "LaLiga",
    country: "Espagne",
    accent: "#f8fafc",
  },
  {
    id: "arsenal",
    name: "Arsenal",
    league: "Premier League",
    country: "Angleterre",
    accent: "#dc2626",
  },
];

function fulfillJson(route: Route, json: unknown, status = 200) {
  return route.fulfill({
    contentType: "application/json",
    json,
    status,
  });
}

export async function mockShopApi(page: Page) {
  let reviews: ProductReview[] = [
    {
      id: 1,
      productId: "prod-real-home",
      customerName: "Client test",
      rating: 5,
      comment: "Qualite nickel.",
      createdAt: "2026-04-18T10:00:00.000Z",
    },
  ];

  await page.route(/\/api\/products\/[^/]+\/reviews$/, async (route) => {
    if (route.request().method() === "POST") {
      const body = JSON.parse(route.request().postData() ?? "{}") as {
        comment?: string;
        customerName?: string;
        rating?: number;
      };
      const review: ProductReview = {
        id: reviews.length + 1,
        productId: "prod-real-home",
        customerName: body.customerName ?? "Client",
        rating: body.rating ?? 5,
        comment: body.comment ?? "",
        createdAt: "2026-04-19T10:00:00.000Z",
      };
      reviews = [review, ...reviews];

      await fulfillJson(route, review, 201);
      return;
    }

    await fulfillJson(route, reviews);
  });

  await page.route(/\/api\/products\/slug\/[^/]+$/, async (route) => {
    const slug = route.request().url().split("/").pop();
    const product = products.find((item) => item.slug === slug);

    await fulfillJson(route, product ?? { message: "Product not found" }, product ? 200 : 404);
  });

  await page.route(/\/api\/products$/, async (route) => {
    await fulfillJson(route, products);
  });

  await page.route(/\/api\/categories$/, async (route) => {
    await fulfillJson(route, categories);
  });

  await page.route(/\/api\/teams$/, async (route) => {
    await fulfillJson(route, teams);
  });

  await page.route(/\/api\/sizes$/, async (route) => {
    await fulfillJson(route, sizes);
  });

  await page.route(/\/api\/home-sections$/, async (route) => {
    await fulfillJson(route, []);
  });
}

import { chromium, type BrowserContext, type Page, type Route } from "@playwright/test";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import type { CartItem, Category, Order, Product, ProductReview, Size, Team } from "../src/lib/types";

const port = Number(process.env.SCREENSHOT_PORT ?? 4333);
const baseUrl = `http://127.0.0.1:${port}`;
const outputDir = path.resolve(process.cwd(), "process-screenshots");
const adminSessionKey = "jersey-store.admin-session";

const sizes: Size[] = ["S", "M", "L", "XL", "XXL", "XXXL"];

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
  {
    id: "accessory",
    name: "Accessoires",
    description: "Complements pour la tenue.",
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

const demoProduct: Product = {
  id: "prod-real-home",
  slug: "pack-real-madrid-home",
  name: "Pack Real Madrid Home 2026",
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
  description: "Pack Real Madrid blanc avec maillot et short assorti, disponible avec flocage.",
  sizes,
  stock: { S: 8, M: 12, L: 10, XL: 7, XXL: 4, XXXL: 2 },
  images: ["/products/real-madrid-home-pack.jpeg"],
  visual: {
    primary: "#f8fafc",
    secondary: "#111111",
    trim: "#d4af37",
    pattern: "clean",
  },
  isNew: true,
  isPopular: true,
  allowFlocking: true,
  createdAt: "2026-04-16T00:00:00.000Z",
};

const secondProduct: Product = {
  ...demoProduct,
  id: "prod-arsenal-away",
  slug: "maillot-arsenal-away-white",
  name: "Maillot Arsenal Away White",
  teamId: "arsenal",
  teamName: "Arsenal",
  teamLeague: "Premier League",
  categoryId: "jersey",
  categoryName: "Maillot seul",
  basePrice: 229,
  packPrice: 309,
  originalBasePrice: undefined,
  originalPackPrice: undefined,
  description: "Maillot Arsenal blanc avec accents bordeaux.",
  images: ["/products/arsenal-away-white.jpeg"],
  visual: {
    primary: "#f8fafc",
    secondary: "#7f1d1d",
    trim: "#d4af37",
    pattern: "clean",
  },
  isPopular: false,
};

let savedProduct: Product | null = null;
let savedOrder: Order | null = null;

function assertInsideWorkspace(targetPath: string) {
  const workspace = path.resolve(process.cwd());
  const resolvedTarget = path.resolve(targetPath);

  if (!resolvedTarget.startsWith(workspace + path.sep)) {
    throw new Error(`Refusing to write outside workspace: ${resolvedTarget}`);
  }
}

function prepareOutputDir() {
  assertInsideWorkspace(outputDir);
  fs.rmSync(outputDir, { force: true, recursive: true });
  fs.mkdirSync(outputDir, { recursive: true });
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) {
        await response.text();
        return;
      }
    } catch {
      await delay(500);
    }
  }

  throw new Error("Next dev server did not start in time.");
}

async function startServer() {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1_000) });
    if (response.ok) {
      return undefined;
    }
  } catch {
    // Start a local server below.
  }

  const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  const server = spawn(
    process.execPath,
    [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NEXT_TELEMETRY_DISABLED: "1",
        PORT: String(port),
      },
    },
  );

  let output = "";
  server.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  try {
    await waitForServer();
  } catch (error) {
    server.kill();
    throw new Error(`${error instanceof Error ? error.message : String(error)}\n${output}`, { cause: error });
  }

  return server;
}

function enrichProduct(product: Product): Product {
  const team = teams.find((item) => item.id === product.teamId);
  const category = categories.find((item) => item.id === product.categoryId);

  return {
    ...product,
    categoryName: category?.name ?? product.categoryName,
    teamLeague: team?.league ?? product.teamLeague,
    teamName: team?.name ?? product.teamName,
  };
}

function products() {
  return [savedProduct, demoProduct, secondProduct].filter(Boolean) as Product[];
}

function makeOrder(items: CartItem[], customer: Order["customer"]): Order {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  return {
    id: "order-demo-001",
    reference: "KVN-2026-00001",
    customer,
    items: items.map((item) => ({
      ...item,
      lineTotal: item.unitPrice * item.quantity,
    })),
    subtotal,
    total: subtotal,
    status: "new",
    createdAt: "2026-06-12T10:00:00.000Z",
    whatsappMessage: `Bonjour, je veux passer cette commande :\n\nClient : ${customer.fullName}\nTotal : ${subtotal} MAD`,
  };
}

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    contentType: "application/json",
    json,
    status,
  });
}

async function mockApi(context: BrowserContext) {
  const reviews: ProductReview[] = [
    {
      id: 1,
      productId: demoProduct.id,
      customerName: "Client KVN",
      rating: 5,
      comment: "Tres bonne qualite et livraison rapide.",
      createdAt: "2026-06-10T10:00:00.000Z",
    },
  ];

  await context.route(/\/api\/products\/[^/]+\/reviews$/, async (route) => {
    if (route.request().method() === "POST") {
      const body = JSON.parse(route.request().postData() ?? "{}") as Partial<ProductReview>;
      const review: ProductReview = {
        id: reviews.length + 1,
        productId: demoProduct.id,
        customerName: body.customerName ?? "Client",
        rating: body.rating ?? 5,
        comment: body.comment ?? "",
        createdAt: "2026-06-12T10:00:00.000Z",
      };
      reviews.unshift(review);
      await fulfillJson(route, review, 201);
      return;
    }

    await fulfillJson(route, reviews);
  });

  await context.route(/\/api\/products\/slug\/[^/]+$/, async (route) => {
    const slug = route.request().url().split("/").pop();
    const product = products().find((item) => item.slug === slug);
    await fulfillJson(route, product ?? { message: "Product not found" }, product ? 200 : 404);
  });

  await context.route(/\/api\/products\/[^/]+$/, async (route) => {
    const urlParts = route.request().url().split("/");
    const id = urlParts[urlParts.length - 1];
    const product = products().find((item) => item.id === id);
    await fulfillJson(route, product ?? { message: "Product not found" }, product ? 200 : 404);
  });

  await context.route(/\/api\/products$/, async (route) => {
    if (route.request().method() === "POST") {
      const product = JSON.parse(route.request().postData() ?? "{}") as Product;
      savedProduct = enrichProduct(product);
      await fulfillJson(route, savedProduct, 201);
      return;
    }

    await fulfillJson(route, products());
  });

  await context.route(/\/api\/categories$/, async (route) => fulfillJson(route, categories));
  await context.route(/\/api\/teams$/, async (route) => fulfillJson(route, teams));
  await context.route(/\/api\/sizes$/, async (route) => fulfillJson(route, sizes));
  await context.route(/\/api\/home-sections$/, async (route) => fulfillJson(route, []));

  await context.route(/\/api\/orders\/[^/]+$/, async (route) => {
    await fulfillJson(route, savedOrder ?? { message: "Order not found" }, savedOrder ? 200 : 404);
  });

  await context.route(/\/api\/orders$/, async (route) => {
    if (route.request().method() === "POST") {
      const body = JSON.parse(route.request().postData() ?? "{}") as {
        customer: Order["customer"];
        items: CartItem[];
      };
      savedOrder = makeOrder(body.items, body.customer);
      await fulfillJson(route, savedOrder, 201);
      return;
    }

    await fulfillJson(route, savedOrder ? [savedOrder] : []);
  });
}

async function preparePage(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition-duration: 0s !important;
      }
      html { scroll-behavior: auto !important; }
    `,
  }).catch(() => undefined);
}

async function screenshot(page: Page, fileName: string, fullPage = true) {
  await page.waitForTimeout(300);
  const target = path.join(outputDir, fileName);
  assertInsideWorkspace(target);
  await page.screenshot({ fullPage, path: target });
  console.log(`created ${path.relative(process.cwd(), target)}`);
}

async function setAdminSession(page: Page) {
  await page.evaluate((key) => {
    window.localStorage.setItem(
      key,
      JSON.stringify({
        email: "admin@kvnfootwear.ma",
        loggedAt: new Date().toISOString(),
      }),
    );
  }, adminSessionKey);
}

async function fillProductForm(page: Page) {
  await page.getByLabel("Nom du produit").fill("Pack Real Madrid Third 2026");
  await page.locator("#team").selectOption("real-madrid");
  await page.locator("#category").selectOption("pack");
  await page.getByLabel("Description").fill("Pack premium maillot et short Real Madrid, disponible avec flocage.");
  await page.locator("#basePrice").fill("249");
  await page.locator("#originalBasePrice").fill("299");
  await page.locator("#packPrice").fill("349");
  await page.locator("#originalPackPrice").fill("399");
  await page.locator("#flockingPrice").fill("39");

  for (const [size, quantity] of Object.entries({ S: "8", M: "12", L: "10", XL: "7", XXL: "4", XXXL: "2" })) {
    await page.locator(`#stock-${size}`).fill(quantity);
  }
}

async function runAdminScreenshots(browserContext: BrowserContext) {
  const page = await browserContext.newPage();
  await preparePage(page);

  await page.goto(`${baseUrl}/admin/login`);
  await page.getByLabel("Email").fill("admin@kvnfootwear.ma");
  await page.getByLabel("Mot de passe").fill("admin123");
  await screenshot(page, "01-admin-connexion.png");

  await setAdminSession(page);
  await page.goto(`${baseUrl}/admin/produits/nouveau`);
  await page.waitForSelector("#name");
  await fillProductForm(page);
  await screenshot(page, "02-admin-formulaire-produit-rempli.png");

  await page.getByRole("button", { name: "Enregistrer" }).click();
  await page.getByRole("dialog").waitFor();
  await screenshot(page, "03-admin-confirmation-ajout-produit.png");

  await page.getByRole("button", { name: "Ajouter" }).click();
  await page.waitForURL("**/admin/produits");
  await page.getByText("Pack Real Madrid Third 2026").first().waitFor();
  await screenshot(page, "04-admin-produit-ajoute-liste.png");

  await page.close();
}

async function runCustomerScreenshots(browserContext: BrowserContext) {
  const page = await browserContext.newPage();
  await preparePage(page);
  await page.route("https://wa.me/**", (route) => route.abort());

  await page.goto(`${baseUrl}/catalogue`);
  await page.getByText("Pack Real Madrid Third 2026").first().waitFor();
  await screenshot(page, "05-client-catalogue.png");

  await page.goto(`${baseUrl}/produit/${demoProduct.slug}`);
  await page.getByRole("heading", { name: demoProduct.name }).waitFor();
  await screenshot(page, "06-client-fiche-produit.png");

  await page.getByRole("button", { name: "Ajouter au panier" }).click();
  await page.getByRole("link", { name: "Voir le panier" }).click();
  await page.getByRole("heading", { name: "Panier" }).waitFor();
  await screenshot(page, "07-client-panier.png");

  await page.getByRole("link", { name: "Valider la commande" }).click();
  await page.getByLabel("Nom complet").fill("Youssef Client");
  await page.locator("#phone").fill("+212 600-000000");
  await page.getByLabel("Ville").fill("Casablanca");
  await page.getByLabel("Adresse").fill("12 Rue Exemple, Casablanca");
  await screenshot(page, "08-client-validation-commande.png");

  await page.getByRole("button", { name: "Commander sur WhatsApp" }).click();
  await page.getByRole("heading", { name: /Commande enregistr/i }).waitFor();
  await screenshot(page, "09-client-confirmation-whatsapp.png");

  await page.close();
}

async function main() {
  prepareOutputDir();
  const server = await startServer();
  const browser = await chromium.launch();

  try {
    const adminContext = await browser.newContext({
      baseURL: baseUrl,
      locale: "fr-FR",
      viewport: { height: 900, width: 1440 },
    });
    await mockApi(adminContext);
    await runAdminScreenshots(adminContext);
    await adminContext.close();

    const customerContext = await browser.newContext({
      baseURL: baseUrl,
      locale: "fr-FR",
      viewport: { height: 900, width: 1440 },
    });
    await mockApi(customerContext);
    await runCustomerScreenshots(customerContext);
    await customerContext.close();
  } finally {
    await browser.close();
    server?.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

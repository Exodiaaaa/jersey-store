import type { CartItem, Customer, Product, Size } from "../../src/lib/types";

export function makeProduct(overrides: Partial<Product> = {}): Product {
  const stock = { S: 4, M: 3, L: 2, XL: 1, XXL: 0, XXXL: 0 };
  const { stock: stockOverrides, visual: visualOverrides, ...restOverrides } = overrides;

  return {
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
    sizes: ["S", "M", "L", "XL"],
    stock: { ...stock, ...stockOverrides },
    images: ["/products/real-madrid-home-pack.jpeg"],
    visual: {
      primary: visualOverrides?.primary ?? "#ffffff",
      secondary: visualOverrides?.secondary ?? "#111111",
      trim: visualOverrides?.trim ?? "#d4af37",
      pattern: visualOverrides?.pattern ?? "clean",
    },
    isNew: true,
    isPopular: true,
    allowFlocking: true,
    createdAt: "2026-04-16T00:00:00.000Z",
    ...restOverrides,
  };
}

export function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  const { flocking: flockingOverrides, visual: visualOverrides, ...restOverrides } = overrides;

  return {
    id: "cart-1",
    productId: "prod-real-home",
    productName: "Pack Real Madrid Home",
    teamName: "Real Madrid",
    size: "M",
    type: "pack",
    quantity: 2,
    unitPrice: 349,
    flocking: {
      mode: flockingOverrides?.mode ?? "none",
      name: flockingOverrides?.name,
      number: flockingOverrides?.number,
      player: flockingOverrides?.player,
      note: flockingOverrides?.note,
    },
    visual: {
      primary: visualOverrides?.primary ?? "#ffffff",
      secondary: visualOverrides?.secondary ?? "#111111",
      trim: visualOverrides?.trim ?? "#d4af37",
      pattern: visualOverrides?.pattern ?? "clean",
    },
    image: "/products/real-madrid-home-pack.jpeg",
    ...restOverrides,
  };
}

export function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    fullName: "Imran Test",
    phone: "+212600000000",
    city: "Casablanca",
    address: "12 Rue Test",
    ...overrides,
  };
}

export function makeDbProduct(overrides: Record<string, unknown> = {}) {
  return {
    id: "prod-real-home",
    slug: "pack-real-madrid-home",
    name: "Pack Real Madrid Home",
    teamId: "real-madrid",
    team: { league: "LaLiga", name: "Real Madrid" },
    categoryId: "pack",
    category: { name: "Pack maillot + short" },
    basePrice: 249,
    packPrice: 349,
    originalBasePrice: 299,
    originalPackPrice: 399,
    hasJersey: false,
    hasPack: true,
    flockingPrice: 39,
    description: "Pack blanc avec short assorti.",
    visualPrimary: "#ffffff",
    visualSecondary: "#111111",
    visualTrim: "#d4af37",
    visualPattern: "clean",
    isNew: true,
    isPopular: true,
    allowFlocking: true,
    createdAt: new Date("2026-04-16T12:00:00.000Z"),
    images: [
      { url: "/b.jpeg", sortOrder: 2 },
      { url: "/a.jpeg", sortOrder: 1 },
    ],
    stocks: [
      { size: "XL", quantity: 1 },
      { size: "S", quantity: 4 },
      { size: "M", quantity: 3 },
    ],
    ...overrides,
  };
}

export function makeDbOrderItem(overrides: Record<string, unknown> = {}) {
  return {
    cartItemId: "cart-1",
    productId: "prod-real-home",
    productName: "Pack Real Madrid Home",
    teamName: "Real Madrid",
    size: "M" as Size,
    type: "pack",
    quantity: 2,
    unitPrice: 349,
    lineTotal: 698,
    flockingMode: "none",
    flockingName: null,
    flockingNumber: null,
    flockingPlayer: null,
    flockingNote: null,
    visualPrimary: "#ffffff",
    visualSecondary: "#111111",
    visualTrim: "#d4af37",
    visualPattern: "clean",
    image: "/products/real-madrid-home-pack.jpeg",
    ...overrides,
  };
}

export function makeDbOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-1",
    reference: "KVN-2026-00001",
    customerName: "Imran Test",
    customerPhone: "+212600000000",
    customerCity: "Casablanca",
    customerAddress: "12 Rue Test",
    subtotal: 698,
    total: 698,
    status: "new",
    whatsappMessage: "Bonjour",
    createdAt: new Date("2026-04-16T12:00:00.000Z"),
    items: [makeDbOrderItem()],
    ...overrides,
  };
}

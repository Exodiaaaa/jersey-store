import { CartItem, Category, HomeSection, Order, OrderItem, OrderStatus, Product, Size, Team } from "@/lib/types";

type DbProduct = {
  id: string;
  slug: string;
  name: string;
  teamId: string;
  team?: { league: string; name: string } | null;
  categoryId: string;
  category?: { name: string } | null;
  basePrice: number;
  packPrice: number;
  originalBasePrice: number | null;
  originalPackPrice: number | null;
  flockingPrice: number;
  description: string;
  visualPrimary: string;
  visualSecondary: string;
  visualTrim: string;
  visualPattern: Product["visual"]["pattern"] | string;
  isNew: boolean;
  isPopular: boolean;
  allowFlocking: boolean;
  createdAt: Date;
  images: Array<{ url: string; sortOrder: number }>;
  stocks: Array<{ size: string; quantity: number }>;
};

type DbOrder = {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerAddress: string;
  subtotal: number;
  total: number;
  status: string;
  whatsappMessage: string;
  createdAt: Date;
  items: DbOrderItem[];
};

type DbHomeSection = {
  id: string;
  title: string;
  subtitle: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  products: Array<{
    productId: string;
    sortOrder: number;
    product: DbProduct;
  }>;
};

type DbOrderItem = {
  cartItemId: string;
  productId: string;
  productName: string;
  teamName: string;
  size: string;
  type: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  flockingMode: string;
  flockingName: string | null;
  flockingNumber: string | null;
  flockingPlayer: string | null;
  flockingNote: string | null;
  visualPrimary: string;
  visualSecondary: string;
  visualTrim: string;
  visualPattern: Product["visual"]["pattern"] | string;
  image: string | null;
};

const productPatterns = ["diagonal", "stripes", "halves", "clean", "racing"] as const;
const orderStatuses = ["new", "confirmed", "preparing", "ready", "delivered", "cancelled"] as const;
const productSizes: Size[] = ["S", "M", "L", "XL", "XXL", "XXXL"];

function toPattern(pattern: string): Product["visual"]["pattern"] {
  return productPatterns.includes(pattern as Product["visual"]["pattern"])
    ? (pattern as Product["visual"]["pattern"])
    : "clean";
}

function toStatus(status: string): OrderStatus {
  return orderStatuses.includes(status as OrderStatus) ? (status as OrderStatus) : "new";
}

export function mapDbProduct(product: DbProduct): Product {
  const stock = product.stocks.reduce(
    (acc, item) => ({
      ...acc,
      [item.size]: item.quantity,
    }),
    { S: 0, M: 0, L: 0, XL: 0, XXL: 0, XXXL: 0 } as Product["stock"],
  );
  const sortedImages = [...product.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const sizes = product.stocks
    .map((item) => item.size)
    .filter((size): size is Size => productSizes.includes(size as Size))
    .sort((a, b) => productSizes.indexOf(a) - productSizes.indexOf(b));

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    teamId: product.teamId,
    teamName: product.team?.name,
    teamLeague: product.team?.league,
    categoryId: product.categoryId,
    categoryName: product.category?.name,
    basePrice: product.basePrice,
    packPrice: product.packPrice,
    originalBasePrice: product.originalBasePrice ?? undefined,
    originalPackPrice: product.originalPackPrice ?? undefined,
    flockingPrice: product.flockingPrice,
    description: product.description,
    sizes,
    stock,
    images: sortedImages.map((image) => image.url),
    visual: {
      primary: product.visualPrimary,
      secondary: product.visualSecondary,
      trim: product.visualTrim,
      pattern: toPattern(product.visualPattern),
    },
    isNew: product.isNew,
    isPopular: product.isPopular,
    allowFlocking: product.allowFlocking,
    createdAt: product.createdAt.toISOString(),
  };
}

export function mapDbCategory(category: Category): Category {
  return category;
}

export function mapDbTeam(team: Team): Team {
  return team;
}

export function mapDbHomeSection(section: DbHomeSection): HomeSection {
  const sortedProducts = [...section.products].sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    id: section.id,
    title: section.title,
    subtitle: section.subtitle ?? undefined,
    isActive: section.isActive,
    sortOrder: section.sortOrder,
    productIds: sortedProducts.map((item) => item.productId),
    products: sortedProducts.map((item) => mapDbProduct(item.product)),
    createdAt: section.createdAt.toISOString(),
  };
}

export function mapDbOrderItem(item: DbOrderItem): OrderItem {
  const cartItem: CartItem = {
    id: item.cartItemId,
    productId: item.productId,
    productName: item.productName,
    teamName: item.teamName,
    size: item.size as Size,
    type: item.type as CartItem["type"],
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    flocking: {
      mode: item.flockingMode as CartItem["flocking"]["mode"],
      name: item.flockingName ?? undefined,
      number: item.flockingNumber ?? undefined,
      player: item.flockingPlayer ?? undefined,
      note: item.flockingNote ?? undefined,
    },
    visual: {
      primary: item.visualPrimary,
      secondary: item.visualSecondary,
      trim: item.visualTrim,
      pattern: toPattern(item.visualPattern),
    },
    image: item.image ?? undefined,
  };

  return {
    ...cartItem,
    lineTotal: item.lineTotal,
  };
}

export function mapDbOrder(order: DbOrder): Order {
  return {
    id: order.id,
    reference: order.reference,
    customer: {
      fullName: order.customerName,
      phone: order.customerPhone,
      city: order.customerCity,
      address: order.customerAddress,
    },
    items: order.items.map(mapDbOrderItem),
    subtotal: order.subtotal,
    total: order.total,
    status: toStatus(order.status),
    createdAt: order.createdAt.toISOString(),
    whatsappMessage: order.whatsappMessage,
  };
}

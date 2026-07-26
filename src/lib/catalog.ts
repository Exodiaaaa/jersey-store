import { Product, ProductCategoryId, ProductType, Size } from "@/lib/types";
import { getProductSaleMode } from "@/lib/product-sales";

export type ProductFilters = {
  query?: string;
  league?: string;
  team?: string;
  category?: ProductCategoryId | "all";
  size?: Size | "all";
  maxPrice?: number;
  novelty?: "all" | "new";
};

export function getProductTeamName(product: Pick<Product, "teamId" | "teamName">) {
  return product.teamName ?? product.teamId;
}

export function getProductCategoryName(product: Pick<Product, "categoryId" | "categoryName">) {
  return product.categoryName ?? product.categoryId;
}

export function getUnitPrice(product: Product, type: ProductType, hasFlocking: boolean) {
  const base = getProductCurrentPrice(product, type);
  return hasFlocking && product.allowFlocking ? base + product.flockingPrice : base;
}

export function getProductCurrentPrice(product: Product, type: ProductType) {
  return type === "pack" ? product.packPrice : product.basePrice;
}

export function getProductOriginalPrice(product: Product, type: ProductType) {
  const currentPrice = getProductCurrentPrice(product, type);
  const originalPrice = type === "pack" ? product.originalPackPrice : product.originalBasePrice;

  return originalPrice && originalPrice > currentPrice ? originalPrice : undefined;
}

export function getProductPriceInfo(product: Product, type: ProductType) {
  return {
    currentPrice: getProductCurrentPrice(product, type),
    originalPrice: getProductOriginalPrice(product, type),
  };
}

export function getAvailableProductTypes(product: Product): ProductType[] {
  const mode = getProductSaleMode(product);

  if (mode === "jersey") return ["jersey"];
  if (mode === "pack") return ["pack"];
  return product.categoryId === "pack" ? ["pack", "jersey"] : ["jersey", "pack"];
}

export function getDefaultProductType(product: Product): ProductType {
  return getAvailableProductTypes(product)[0] ?? "jersey";
}

export function getLowestAvailablePrice(product: Product) {
  const types = getAvailableProductTypes(product);
  return Math.min(...types.map((type) => getProductCurrentPrice(product, type)));
}

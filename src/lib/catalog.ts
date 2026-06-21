import { Product, ProductCategoryId, ProductType, Size } from "@/lib/types";

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
  const hasConfiguredTypes = product.hasJersey !== undefined || product.hasPack !== undefined;

  if (hasConfiguredTypes) {
    const types: ProductType[] = [];

    if (product.hasJersey) {
      types.push("jersey");
    }

    if (product.hasPack) {
      types.push("pack");
    }

    if (types.length === 0) {
      return ["jersey"];
    }

    if (product.categoryId === "pack" && types.includes("pack")) {
      return ["pack", ...types.filter((type) => type !== "pack")];
    }

    return types;
  }

  if (product.categoryId === "accessory") {
    return ["jersey"];
  }

  return product.categoryId === "pack" ? ["pack", "jersey"] : ["jersey", "pack"];
}

export function getDefaultProductType(product: Product): ProductType {
  return getAvailableProductTypes(product)[0] ?? "jersey";
}

export function getLowestAvailablePrice(product: Product) {
  const types = getAvailableProductTypes(product);
  return Math.min(...types.map((type) => getProductCurrentPrice(product, type)));
}

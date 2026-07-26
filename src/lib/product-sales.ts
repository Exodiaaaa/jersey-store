import type { Product, ProductSaleMode } from "@/lib/types";

const saleModeConfigurations: Record<
  ProductSaleMode,
  { categoryId: "jersey" | "pack"; hasJersey: boolean; hasPack: boolean; label: string }
> = {
  jersey: {
    categoryId: "jersey",
    hasJersey: true,
    hasPack: false,
    label: "Maillot seul",
  },
  pack: {
    categoryId: "pack",
    hasJersey: false,
    hasPack: true,
    label: "Pack maillot + short uniquement",
  },
  both: {
    categoryId: "pack",
    hasJersey: true,
    hasPack: true,
    label: "Maillot seul ou pack",
  },
};

export function getProductSaleMode(
  product: Pick<Product, "categoryId" | "hasJersey" | "hasPack">,
): ProductSaleMode {
  const hasConfiguredTypes = product.hasJersey !== undefined || product.hasPack !== undefined;

  if (hasConfiguredTypes) {
    if (product.hasJersey && product.hasPack) return "both";
    if (product.hasPack) return "pack";
    return "jersey";
  }

  return product.categoryId === "pack" ? "pack" : "jersey";
}

export function getProductSaleConfiguration(mode: ProductSaleMode) {
  return saleModeConfigurations[mode];
}

export function getProductSaleModeLabel(product: Pick<Product, "categoryId" | "hasJersey" | "hasPack">) {
  return getProductSaleConfiguration(getProductSaleMode(product)).label;
}

import { categories, products, teams } from "@/data/catalog";
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

export function getTeamName(teamId: string) {
  return teams.find((team) => team.id === teamId)?.name ?? "Equipe";
}

export function getCategoryName(categoryId: string) {
  return categories.find((category) => category.id === categoryId)?.name ?? "Produit";
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function getRelatedProducts(product: Product) {
  return products
    .filter((item) => item.id !== product.id && item.teamId === product.teamId)
    .concat(products.filter((item) => item.id !== product.id && item.isPopular))
    .slice(0, 4);
}

export function getFilteredProducts(filters: ProductFilters) {
  return products.filter((product) => {
    const availableTypes = getAvailableProductTypes(product);
    const query = filters.query?.trim().toLowerCase();
    const productTeam = teams.find((team) => team.id === product.teamId);
    const productCategory = categories.find((category) => category.id === product.categoryId);
    const typePrice =
      filters.category === "pack"
        ? product.packPrice
        : filters.category === "jersey"
          ? product.basePrice
          : Math.min(product.basePrice, product.packPrice);
    const matchesQuery =
      !query ||
      product.name.toLowerCase().includes(query) ||
      productTeam?.name.toLowerCase().includes(query) ||
      productTeam?.league.toLowerCase().includes(query) ||
      productCategory?.name.toLowerCase().includes(query);
    const matchesLeague =
      !filters.league || filters.league === "all" || productTeam?.league === filters.league;
    const matchesTeam = !filters.team || filters.team === "all" || product.teamId === filters.team;
    const matchesCategory =
      !filters.category ||
      filters.category === "all" ||
      (filters.category === "jersey" && availableTypes.includes("jersey")) ||
      (filters.category === "pack" && availableTypes.includes("pack")) ||
      product.categoryId === filters.category;
    const matchesSize =
      !filters.size ||
      filters.size === "all" ||
      (product.sizes.includes(filters.size) && product.stock[filters.size] > 0);
    const matchesPrice = !filters.maxPrice || typePrice <= filters.maxPrice;
    const matchesNovelty = !filters.novelty || filters.novelty === "all" || product.isNew;

    return matchesQuery && matchesLeague && matchesTeam && matchesCategory && matchesSize && matchesPrice && matchesNovelty;
  });
}

export function getUnitPrice(product: Product, type: ProductType, hasFlocking: boolean) {
  const base = type === "pack" ? product.packPrice : product.basePrice;
  return hasFlocking && product.allowFlocking ? base + product.flockingPrice : base;
}

export function getAvailableProductTypes(product: Product): ProductType[] {
  if (product.categoryId === "accessory") {
    return ["jersey"];
  }

  if (product.categoryId === "pack") {
    return ["pack", "jersey"];
  }

  return ["jersey", "pack"];
}

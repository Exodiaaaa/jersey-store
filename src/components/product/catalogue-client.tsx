"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { categories, products, sizes, teams } from "@/data/catalog";
import { clientApi } from "@/lib/client-api";
import { getAvailableProductTypes, ProductFilters } from "@/lib/catalog";
import { Category, Product, ProductCategoryId, Size, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { ProductGrid } from "@/components/product/product-grid";

const defaultFilters: ProductFilters = {
  query: "",
  team: "all",
  category: "all",
  size: "all",
  maxPrice: 400,
  novelty: "all",
};

export function CatalogueClient() {
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [adminProducts, setAdminProducts] = useState<Product[]>(products);
  const [adminCategories, setAdminCategories] = useState<Category[]>(categories);
  const [adminTeams, setAdminTeams] = useState<Team[]>(teams);

  useEffect(() => {
    void Promise.all([clientApi.getProducts(), clientApi.getCategories(), clientApi.getTeams()])
      .then(([nextProducts, nextCategories, nextTeams]) => {
        setAdminProducts(nextProducts);
        setAdminCategories(nextCategories);
        setAdminTeams(nextTeams);
      })
      .catch(() => undefined);
  }, []);

  const teamById = useMemo(() => {
    return new Map(adminTeams.map((team) => [team.id, team]));
  }, [adminTeams]);

  const categoryById = useMemo(() => {
    return new Map(adminCategories.map((category) => [category.id, category]));
  }, [adminCategories]);

  const teamOptions = useMemo(() => {
    const activeTeamIds = new Set(adminProducts.map((product) => product.teamId));
    return adminTeams.filter((team) => activeTeamIds.has(team.id));
  }, [adminProducts, adminTeams]);

  const sizeOptions = useMemo(() => {
    return sizes.filter((size) =>
      adminProducts.some((product) => product.sizes.includes(size) && product.stock[size] > 0),
    );
  }, [adminProducts]);

  const filteredProducts = useMemo(() => {
    return adminProducts.filter((product) => {
      const availableTypes = getAvailableProductTypes(product);
      const productTeam = teamById.get(product.teamId);
      const productCategory = categoryById.get(product.categoryId);
      const query = filters.query?.trim().toLowerCase();
      const selectedTeam = filters.team ?? "all";
      const selectedCategory = filters.category ?? "all";
      const selectedSize = filters.size ?? "all";
      const selectedNovelty = filters.novelty ?? "all";
      const filterPrice =
        selectedCategory === "pack"
          ? product.packPrice
          : selectedCategory === "jersey"
            ? product.basePrice
            : Math.min(product.basePrice, product.packPrice);

      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        productTeam?.name.toLowerCase().includes(query) ||
        productCategory?.name.toLowerCase().includes(query);
      const matchesTeam = selectedTeam === "all" || product.teamId === selectedTeam;
      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "jersey" && availableTypes.includes("jersey")) ||
        (selectedCategory === "pack" && availableTypes.includes("pack")) ||
        product.categoryId === selectedCategory;
      const matchesSize =
        selectedSize === "all" || (product.sizes.includes(selectedSize) && product.stock[selectedSize] > 0);
      const matchesPrice = !filters.maxPrice || filterPrice <= filters.maxPrice;
      const matchesNovelty = selectedNovelty === "all" || product.isNew;

      return matchesQuery && matchesTeam && matchesCategory && matchesSize && matchesPrice && matchesNovelty;
    });
  }, [adminProducts, categoryById, filters, teamById]);

  const updateFilter = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-lime-200">Catalogue</p>
            <h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">Trouver une tenue</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAdvanced((value) => !value)} type="button" variant="secondary">
              <SlidersHorizontal size={17} />
              Plus de filtres
            </Button>
            <Button onClick={() => setFilters(defaultFilters)} type="button" variant="ghost">
              <RotateCcw size={16} />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-2">
            <Label htmlFor="search">Recherche</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={17} />
              <Input
                className="pl-10"
                id="search"
                onChange={(event) => updateFilter("query", event.target.value)}
                placeholder="Real Madrid, Arsenal..."
                value={filters.query ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Categorie</Label>
            <Select
              id="category"
              onChange={(event) => updateFilter("category", event.target.value as ProductCategoryId | "all")}
              value={filters.category}
            >
              <option value="all">Toutes les categories</option>
              {adminCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="team">Equipe</Label>
            <Select
              id="team"
              onChange={(event) => updateFilter("team", event.target.value)}
              value={filters.team}
            >
              <option value="all">Toutes les equipes</option>
              {teamOptions.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {showAdvanced && (
          <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="size">Taille</Label>
              <Select
                id="size"
                onChange={(event) => updateFilter("size", event.target.value as Size | "all")}
                value={filters.size}
              >
                <option value="all">Toutes les tailles</option>
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-3">
              <Label htmlFor="price">Prix max : {filters.maxPrice} MAD</Label>
              <input
                className="h-2 w-full accent-lime-300"
                id="price"
                max="450"
                min="100"
                onChange={(event) => updateFilter("maxPrice", Number(event.target.value))}
                type="range"
                value={filters.maxPrice}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="novelty">Nouveaute</Label>
              <Select
                id="novelty"
                onChange={(event) => updateFilter("novelty", event.target.value as "all" | "new")}
                value={filters.novelty}
              >
                <option value="all">Tous les produits</option>
                <option value="new">Nouveaux maillots</option>
              </Select>
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <p className="text-sm text-zinc-400">{filteredProducts.length} produit(s)</p>
        </div>
        <ProductGrid products={filteredProducts} />
      </section>
    </div>
  );
}

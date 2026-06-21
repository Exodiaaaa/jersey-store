"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { clientApi } from "@/lib/client-api";
import { getAvailableProductTypes, getLowestAvailablePrice, getProductCurrentPrice, ProductFilters } from "@/lib/catalog";
import { Category, Product, ProductCategoryId, Size, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { ProductGrid } from "@/components/product/product-grid";

const defaultFilters: ProductFilters = {
  query: "",
  league: "all",
  team: "all",
  category: "all",
  size: "all",
  maxPrice: 400,
  novelty: "all",
};

export function CatalogueClient() {
  const [filters, setFilters] = useState<ProductFilters>(defaultFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [adminProducts, setAdminProducts] = useState<Product[]>([]);
  const [adminCategories, setAdminCategories] = useState<Category[]>([]);
  const [adminTeams, setAdminTeams] = useState<Team[]>([]);
  const [adminSizes, setAdminSizes] = useState<Size[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const requestedFilters: ProductFilters = {
      ...defaultFilters,
      category: (searchParams.get("category") as ProductCategoryId | "all" | null) ?? defaultFilters.category,
      league: searchParams.get("league") ?? defaultFilters.league,
      novelty: searchParams.get("novelty") === "new" ? "new" : defaultFilters.novelty,
      query: searchParams.get("query") ?? defaultFilters.query,
      team: searchParams.get("team") ?? defaultFilters.team,
    };

    void Promise.all([clientApi.getProducts(), clientApi.getCategories(), clientApi.getTeams(), clientApi.getSizes()])
      .then(([nextProducts, nextCategories, nextTeams, nextSizes]) => {
        setAdminProducts(nextProducts);
        setAdminCategories(nextCategories);
        setAdminTeams(nextTeams);
        setAdminSizes(nextSizes);
        setFilters(requestedFilters);
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  const teamById = useMemo(() => {
    return new Map(adminTeams.map((team) => [team.id, team]));
  }, [adminTeams]);

  const categoryById = useMemo(() => {
    return new Map(adminCategories.map((category) => [category.id, category]));
  }, [adminCategories]);

  const leagueOptions = useMemo(() => {
    const leagues = new Set<string>();

    adminProducts.forEach((product) => {
      const league = teamById.get(product.teamId)?.league ?? product.teamLeague;
      if (league) {
        leagues.add(league);
      }
    });

    return Array.from(leagues).sort((a, b) => a.localeCompare(b));
  }, [adminProducts, teamById]);

  const teamOptions = useMemo(() => {
    const activeTeamIds = new Set(adminProducts.map((product) => product.teamId));
    const selectedLeague = filters.league ?? "all";

    return adminTeams.filter((team) => {
      const hasProduct = activeTeamIds.has(team.id);
      const matchesLeague = selectedLeague === "all" || team.league === selectedLeague;

      return hasProduct && matchesLeague;
    });
  }, [adminProducts, adminTeams, filters.league]);

  const sizeOptions = useMemo(() => {
    return adminSizes.filter((size) =>
      adminProducts.some((product) => product.sizes.includes(size) && product.stock[size] > 0),
    );
  }, [adminProducts, adminSizes]);

  const filteredProducts = useMemo(() => {
    return adminProducts.filter((product) => {
      const availableTypes = getAvailableProductTypes(product);
      const productTeam = teamById.get(product.teamId);
      const productCategory = categoryById.get(product.categoryId);
      const productTeamName = productTeam?.name ?? product.teamName ?? product.teamId;
      const productTeamLeague = productTeam?.league ?? product.teamLeague ?? "";
      const productCategoryName = productCategory?.name ?? product.categoryName ?? product.categoryId;
      const query = filters.query?.trim().toLowerCase();
      const selectedLeague = filters.league ?? "all";
      const selectedTeam = filters.team ?? "all";
      const selectedCategory = filters.category ?? "all";
      const selectedSize = filters.size ?? "all";
      const selectedNovelty = filters.novelty ?? "all";
      const filterPrice =
        selectedCategory === "pack" && availableTypes.includes("pack")
          ? getProductCurrentPrice(product, "pack")
          : selectedCategory === "jersey" && availableTypes.includes("jersey")
            ? getProductCurrentPrice(product, "jersey")
            : getLowestAvailablePrice(product);

      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        productTeamName.toLowerCase().includes(query) ||
        productTeamLeague.toLowerCase().includes(query) ||
        productCategoryName.toLowerCase().includes(query);
      const matchesLeague = selectedLeague === "all" || productTeamLeague === selectedLeague;
      const matchesTeam = selectedTeam === "all" || product.teamId === selectedTeam;
      const matchesCategory =
        selectedCategory === "all" ||
        (selectedCategory === "jersey"
          ? availableTypes.includes("jersey")
          : selectedCategory === "pack"
            ? availableTypes.includes("pack")
            : product.categoryId === selectedCategory);
      const matchesSize =
        selectedSize === "all" || (product.sizes.includes(selectedSize) && product.stock[selectedSize] > 0);
      const matchesPrice = !filters.maxPrice || filterPrice <= filters.maxPrice;
      const matchesNovelty = selectedNovelty === "all" || product.isNew;

      return matchesQuery && matchesLeague && matchesTeam && matchesCategory && matchesSize && matchesPrice && matchesNovelty;
    });
  }, [adminProducts, categoryById, filters, teamById]);

  const updateFilter = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const updateLeagueFilter = (league: string) => {
    setFilters((current) => {
      const selectedTeam = adminTeams.find((team) => team.id === current.team);
      const shouldResetTeam = league !== "all" && selectedTeam && selectedTeam.league !== league;

      return {
        ...current,
        league,
        team: shouldResetTeam ? "all" : current.team,
      };
    });
  };

  return (
    <div className="grid gap-7">
      <section className="kvn-reveal rounded-[4px] border border-white/12 bg-[#111318] p-4 shadow-[0_18px_55px_rgba(0,0,0,0.16)] sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d9dde2]">Store</p>
            <h1 className="mt-2 text-4xl font-black uppercase leading-none text-white sm:text-5xl">
              Find your kit.
            </h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAdvanced((value) => !value)} type="button" variant="secondary">
              <SlidersHorizontal size={17} />
              Filtres
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
                placeholder="Real Madrid, Arsenal, World Cup..."
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
          <div className="mt-4 grid gap-3 border-t border-white/12 pt-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="league">Championnat</Label>
              <Select
                id="league"
                onChange={(event) => updateLeagueFilter(event.target.value)}
                value={filters.league}
              >
                <option value="all">Tous les championnats</option>
                {leagueOptions.map((league) => (
                  <option key={league} value={league}>
                    {league}
                  </option>
                ))}
              </Select>
            </div>
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
                className="h-2 w-full accent-[#d9dde2]"
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

      <section className="kvn-reveal kvn-reveal-delay-1">
        <div className="mb-4 flex items-end justify-between gap-4">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-white/56">
            {isLoading ? "Chargement des produits..." : `${filteredProducts.length} produit(s)`}
          </p>
        </div>
        <ProductGrid products={filteredProducts} />
      </section>
    </div>
  );
}

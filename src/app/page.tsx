"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Clock3,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { whatsappPhoneNumber } from "@/data/catalog";
import { ProductCard } from "@/components/product/product-card";
import { PriceDisplay } from "@/components/product/price-display";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { getProductCategoryName, getProductPriceInfo } from "@/lib/catalog";
import { clientApi } from "@/lib/client-api";
import { Category, HomeSection, Product, Team } from "@/lib/types";

type HomeSectionProps = {
  subtitle?: string;
  title: string;
  products: Product[];
  tone?: "solid" | "soft";
};

type HomeDisplaySection = HomeSectionProps;

const categoryFallbacks = [
  {
    description: "Maillots seuls",
    href: "/catalogue?category=jersey",
    title: "Jerseys",
  },
  {
    description: "Maillot + short",
    href: "/catalogue?category=pack",
    title: "Ensembles",
  },
  {
    description: "Derniers arrivages",
    href: "/catalogue?novelty=new",
    title: "New drop",
  },
];

function getTeamInitials(team: Team) {
  return team.name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function HomeProductSection({ title, subtitle, products, tone = "solid" }: HomeSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className={tone === "soft" ? "bg-[#263c3b]" : "bg-[#314948]"}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="kvn-reveal mb-5 flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d7ff45]">Top picks</p>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none text-white sm:text-5xl lg:text-6xl">
              {title}
            </h2>
            {subtitle && <p className="mt-3 max-w-xl text-sm leading-6 text-white/68">{subtitle}</p>}
          </div>
          <Link
            className="hidden items-center gap-2 text-sm font-black uppercase text-white transition hover:text-[#d7ff45] sm:inline-flex"
            href="/catalogue"
          >
            View all
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="kvn-reveal kvn-reveal-delay-1 kvn-rail-scroll -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0">
          {products.map((product) => (
            <ProductCard
              className="w-[72vw] max-w-[315px] shrink-0 snap-start sm:w-[300px]"
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ShopByClub({ products, teams }: { products: Product[]; teams: Team[] }) {
  const clubCards = teams
    .map((team) => ({
      ...team,
      count: products.filter((product) => product.teamId === team.id).length,
    }))
    .filter((team) => team.count > 0)
    .slice(0, 6);

  if (clubCards.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#314948]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="kvn-reveal mb-5 flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d7ff45]">Shop by club</p>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none text-white sm:text-5xl">
              Pick your colors.
            </h2>
          </div>
          <p className="hidden text-sm font-bold text-white/60 sm:block">1 / {clubCards.length}</p>
        </div>

        <div className="kvn-reveal kvn-reveal-delay-1 kvn-rail-scroll -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0 xl:grid-cols-6">
          {clubCards.map((team) => (
            <Link
              className="kvn-card-lift group min-h-52 w-[72vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-[4px] border border-white/12 bg-[#172625] p-5 transition hover:-translate-y-1 hover:border-[#d7ff45]/60 hover:bg-[#101d1c] lg:w-auto"
              href={`/catalogue?team=${team.id}`}
              key={team.id}
            >
              <span className="text-4xl font-black uppercase text-white">{getTeamInitials(team)}</span>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-white/44">
                {team.league || "Football"} {team.country ? `- ${team.country}` : ""}
              </p>
              <h3 className="mt-2 text-xl font-black text-white">{team.name}</h3>
              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                <span className="text-sm font-bold text-white/72">{team.count}+ produits</span>
                <ChevronRight className="text-[#d7ff45] transition group-hover:translate-x-1" size={20} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ValueBand() {
  const values = [
    {
      icon: ShieldCheck,
      label: "Qualite premium",
      text: "Tenues selectionnees avec photos reelles et verification avant commande.",
    },
    {
      icon: Truck,
      label: "Livre au Maroc",
      text: "Commande rapide, suivi WhatsApp et livraison dans toutes les villes.",
    },
    {
      icon: PackageCheck,
      label: "Packs complets",
      text: "Maillot seul ou ensemble maillot + short selon les disponibilites.",
    },
  ];

  return (
    <section className="bg-[#1b2c2b]">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="kvn-reveal">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d7ff45]">What we stand for</p>
          <h2 className="mt-3 max-w-xl text-4xl font-black uppercase leading-none text-white sm:text-5xl">
            We outfit the people who live for this game.
          </h2>
        </div>
        <div className="grid gap-3">
          {values.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                className="kvn-reveal grid gap-4 border-t border-white/12 py-5 sm:grid-cols-[90px_1fr]"
                key={item.label}
              >
                <div className="flex items-center gap-3 text-[#d7ff45]">
                  <span className="text-sm font-black">{String(index + 1).padStart(2, "0")}</span>
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{item.label}</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">{item.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CategoryTiles({ categories, products }: { categories: Category[]; products: Product[] }) {
  const tiles =
    categories.length > 0
      ? categories.map((category) => ({
          count: products.filter((product) => product.categoryId === category.id).length,
          description: category.description || "Collection disponible",
          href: `/catalogue?category=${category.id}`,
          title: category.name,
        }))
      : categoryFallbacks.map((category) => ({
          ...category,
          count:
            category.href.includes("pack")
              ? products.filter((product) => product.categoryId === "pack").length
              : products.length,
        }));

  if (tiles.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#314948]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="kvn-reveal mb-5 flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d7ff45]">Shop by category</p>
            <h2 className="mt-2 text-4xl font-black uppercase leading-none text-white sm:text-5xl">
              Find your gear.
            </h2>
          </div>
          <Link
            className="hidden items-center gap-2 text-sm font-black uppercase text-white transition hover:text-[#d7ff45] sm:inline-flex"
            href="/catalogue"
          >
            View all
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="kvn-reveal kvn-reveal-delay-1 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((category, index) => (
            <Link
              className="kvn-card-lift group min-h-44 overflow-hidden rounded-[4px] border border-white/12 bg-[#172625] p-5 transition hover:border-[#d7ff45]/60 hover:bg-[#101d1c]"
              href={category.href}
              key={`${category.title}-${index}`}
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d7ff45]">
                {category.count} produits
              </p>
              <h3 className="mt-6 text-3xl font-black uppercase leading-none text-white">{category.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/58">{category.description}</p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-black uppercase text-white">
                Explorer
                <ArrowRight className="transition group-hover:translate-x-1" size={17} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [heroIndex, setHeroIndex] = useState(0);

  const popularProducts = useMemo(
    () => storeProducts.filter((product) => product.isPopular).slice(0, 8),
    [storeProducts],
  );
  const featuredProducts = popularProducts.length > 0 ? popularProducts : storeProducts.slice(0, 8);
  const newProducts = useMemo(
    () => storeProducts.filter((product) => product.isNew).slice(0, 8),
    [storeProducts],
  );
  const packs = useMemo(
    () => storeProducts.filter((product) => product.categoryId === "pack").slice(0, 8),
    [storeProducts],
  );
  const jerseys = useMemo(
    () =>
      storeProducts
        .filter((product) => product.categoryId === "jersey" || getProductCategoryName(product).toLowerCase().includes("maillot"))
        .slice(0, 8),
    [storeProducts],
  );
  const defaultHomeSections = useMemo<HomeDisplaySection[]>(
    () => [
      {
        products: jerseys.length > 0 ? jerseys : storeProducts.slice(0, 8),
        subtitle: "Les maillots les plus demandes, prêts a commander sur WhatsApp.",
        title: "Jerseys",
      },
      {
        products: packs,
        subtitle: "Ensembles maillot + short pour un look complet.",
        title: "Ensembles",
        tone: "soft",
      },
      {
        products: newProducts,
        subtitle: "Les derniers arrivages ajoutes par le vendeur.",
        title: "New drop",
      },
    ],
    [jerseys, newProducts, packs, storeProducts],
  );
  const configuredHomeSections = useMemo<HomeDisplaySection[]>(
    () =>
      homeSections
        .filter((section) => section.isActive && section.products.length > 0)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
        .map((section, index) => ({
          products: section.products,
          subtitle: section.subtitle,
          title: section.title,
          tone: index % 2 === 1 ? "soft" : "solid",
        })),
    [homeSections],
  );
  const displayedHomeSections =
    configuredHomeSections.length > 0 ? configuredHomeSections : defaultHomeSections;
  const heroProducts = useMemo(
    () => storeProducts.filter((product) => product.images.length > 0).slice(0, 7),
    [storeProducts],
  );
  const safeHeroIndex = heroProducts.length > 0 ? heroIndex % heroProducts.length : 0;
  const heroProduct = heroProducts[safeHeroIndex] ?? featuredProducts[0] ?? storeProducts[0];
  const heroPriceInfo = heroProduct
    ? getProductPriceInfo(heroProduct, heroProduct.categoryId === "pack" ? "pack" : "jersey")
    : undefined;
  const heroImage = heroProduct?.images[0];
  const productCountLabel = storeProducts.length > 0 ? `${storeProducts.length}+` : "0";
  const teamCountLabel = teams.length > 0 ? `${teams.length}+` : "0";

  useEffect(() => {
    void Promise.all([
      clientApi.getProducts(),
      clientApi.getHomeSections(),
      clientApi.getCategories(),
      clientApi.getTeams(),
    ])
      .then(([nextProducts, nextHomeSections, nextCategories, nextTeams]) => {
        setStoreProducts(nextProducts);
        setHomeSections(nextHomeSections);
        setCategories(nextCategories);
        setTeams(nextTeams);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (heroProducts.length <= 1) return;

    const interval = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroProducts.length);
    }, 4200);

    return () => window.clearInterval(interval);
  }, [heroProducts.length]);

  return (
    <div className="bg-[#314948] text-white">
      <section className="relative isolate min-h-[calc(100vh-5rem)] overflow-hidden bg-[#172625]">
        {heroImage && (
          <div
            aria-hidden="true"
            className="kvn-parallax absolute inset-0 bg-cover bg-center transition-all duration-1000"
            style={{
              backgroundImage: `linear-gradient(90deg, rgba(18,31,30,0.92), rgba(18,31,30,0.58) 45%, rgba(18,31,30,0.22)), linear-gradient(180deg, rgba(18,31,30,0.22), rgba(18,31,30,0.96)), url("${heroImage.replace(/"/g, "%22")}")`,
            }}
          />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(215,255,69,0.16),transparent_28%)]" />
        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl content-center px-4 py-14 sm:px-6 lg:px-8">
          <div className="kvn-reveal max-w-3xl">
            <Badge tone="lime" className="uppercase tracking-[0.18em]">
              <Sparkles size={14} />
              Premium football gear
            </Badge>
            <h1 className="mt-5 text-6xl font-black uppercase leading-[0.86] text-white sm:text-7xl lg:text-8xl">
              KVN Footwear
              <span className="block text-[#d7ff45]">Store</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg">
              Maillots premium, ensembles complets et flocage personnalise pour les supporters qui
              vivent le football au quotidien.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/catalogue" size="lg">
                Shop now
                <ArrowRight size={19} />
              </LinkButton>
              <LinkButton href={`https://wa.me/${whatsappPhoneNumber}`} size="lg" variant="secondary">
                <MessageCircle size={19} />
                WhatsApp
              </LinkButton>
            </div>
          </div>

          <div className="kvn-reveal kvn-reveal-delay-1 mt-12 grid max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-[4px] border border-white/12 bg-white/12">
            {[
              [productCountLabel, "Products"],
              [teamCountLabel, "Clubs"],
              ["24 h", "Reponse"],
            ].map(([value, label]) => (
              <div className="bg-[#10201f]/82 p-4 backdrop-blur" key={label}>
                <p className="text-3xl font-black text-white">{value}</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/48">{label}</p>
              </div>
            ))}
          </div>

          {heroProduct && heroPriceInfo && (
            <Link
              className="kvn-reveal kvn-reveal-delay-2 kvn-card-lift mt-6 inline-flex max-w-xl items-center justify-between gap-6 overflow-hidden rounded-[4px] border border-white/14 bg-[#10201f]/78 p-4 backdrop-blur transition hover:border-[#d7ff45]/55"
              href={`/produit/${heroProduct.slug}`}
            >
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#d7ff45]">
                  {heroProduct.categoryId === "pack" ? "Pack populaire" : "Produit en vedette"}
                </p>
                <h2 className="mt-2 line-clamp-1 text-lg font-black text-white">{heroProduct.name}</h2>
              </div>
              <PriceDisplay
                currentPrice={heroPriceInfo.currentPrice}
                originalPrice={heroPriceInfo.originalPrice}
                size="lg"
              />
            </Link>
          )}

          {heroProducts.length > 1 && (
            <div className="mt-7 flex gap-2">
              {heroProducts.map((product, index) => (
                <button
                  aria-label={`Voir ${product.name}`}
                  className={[
                    "h-2 rounded-full transition-all",
                    index === safeHeroIndex ? "w-10 bg-[#d7ff45]" : "w-2 bg-white/38 hover:bg-white/70",
                  ].join(" ")}
                  key={product.id}
                  onClick={() => setHeroIndex(index)}
                  type="button"
                />
              ))}
            </div>
          )}

          <div className="absolute bottom-6 left-4 hidden items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-white/50 sm:left-6 lg:left-8 lg:flex">
            <Clock3 size={15} />
            Scroll
          </div>
        </div>
      </section>

      <ShopByClub products={storeProducts} teams={teams} />

      <ValueBand />

      <HomeProductSection
        products={featuredProducts}
        subtitle="Selection courte des produits les plus forts de la boutique."
        title="Featured products"
        tone="solid"
      />

      <div className="overflow-hidden border-y border-white/12 bg-[#101d1c] py-4">
        <div className="kvn-marquee flex w-max items-center gap-8 text-2xl font-black uppercase text-white/92">
          {[
            "Jerseys",
            "Packs",
            "Flocking",
            "New season",
            "Morocco delivery",
            "WhatsApp order",
            "Jerseys",
            "Packs",
            "Flocking",
            "New season",
            "Morocco delivery",
            "WhatsApp order",
          ].map((item, index) => (
            <span className="flex items-center gap-8" key={`${item}-${index}`}>
              {item}
              <span className="text-[#d7ff45]">/</span>
            </span>
          ))}
        </div>
      </div>

      {displayedHomeSections.map((section) => (
        <HomeProductSection
          key={section.title}
          products={section.products}
          subtitle={section.subtitle}
          title={section.title}
          tone={section.tone}
        />
      ))}

      <CategoryTiles categories={categories} products={storeProducts} />

      <section className="bg-[#1b2c2b]">
        <div className="kvn-reveal mx-auto grid max-w-7xl gap-5 px-4 py-12 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d7ff45]">No online payment</p>
            <h2 className="mt-3 text-3xl font-black uppercase leading-none text-white sm:text-4xl">
              Commande simple, confirmation sur WhatsApp.
            </h2>
          </div>
          <LinkButton href="/catalogue" size="lg">
            Commander
            <ArrowRight size={19} />
          </LinkButton>
        </div>
      </section>
    </div>
  );
}

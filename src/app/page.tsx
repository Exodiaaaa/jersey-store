"use client";

import { ArrowRight, MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { products, whatsappPhoneNumber } from "@/data/catalog";
import { ProductCard } from "@/components/product/product-card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { clientApi } from "@/lib/client-api";
import { formatPrice } from "@/lib/format";
import { Product } from "@/lib/types";

type HomeSectionProps = {
  title: string;
  products: Product[];
  tone?: "solid" | "soft";
};

function HomeProductSection({ title, products, tone = "solid" }: HomeSectionProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <section className={tone === "soft" ? "border-y border-white/10 bg-white/[0.025]" : ""}>
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-3xl font-black uppercase leading-none tracking-normal text-white sm:text-4xl lg:text-5xl">
            {title}
          </h2>
          <LinkButton href="/catalogue" variant="ghost">
            Voir tout
            <ArrowRight size={17} />
          </LinkButton>
        </div>
        <div className="kvn-rail-scroll -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {products.map((product) => (
            <ProductCard
              className="w-[72vw] max-w-[310px] shrink-0 snap-start sm:w-[330px] lg:w-auto lg:max-w-none"
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [storeProducts, setStoreProducts] = useState<Product[]>(products);
  const [heroIndex, setHeroIndex] = useState(0);

  const popularProducts = useMemo(
    () => storeProducts.filter((product) => product.isPopular).slice(0, 4),
    [storeProducts],
  );
  const newProducts = useMemo(
    () => storeProducts.filter((product) => product.isNew).slice(0, 4),
    [storeProducts],
  );
  const packs = useMemo(
    () => storeProducts.filter((product) => product.categoryId === "pack").slice(0, 3),
    [storeProducts],
  );
  const jerseys = useMemo(
    () => storeProducts.filter((product) => product.categoryId === "jersey").slice(0, 8),
    [storeProducts],
  );
  const selectionProducts = useMemo(
    () =>
      storeProducts
        .filter((product) => product.teamId === "mexico" || product.name.toLowerCase().includes("mexique"))
        .concat(storeProducts.filter((product) => product.isPopular))
        .filter((product, index, current) => current.findIndex((item) => item.id === product.id) === index)
        .slice(0, 8),
    [storeProducts],
  );
  const heroProducts = useMemo(
    () => storeProducts.filter((product) => product.images.length > 0).slice(0, 7),
    [storeProducts],
  );
  const safeHeroIndex = heroProducts.length > 0 ? heroIndex % heroProducts.length : 0;
  const heroProduct = heroProducts[safeHeroIndex] ?? popularProducts[0] ?? storeProducts[0] ?? products[0];

  useEffect(() => {
    clientApi.getProducts().then(setStoreProducts).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (heroProducts.length <= 1) return;

    const interval = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroProducts.length);
    }, 3600);

    return () => window.clearInterval(interval);
  }, [heroProducts.length]);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-white/10 bg-[#071214]">
        <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="relative z-10 max-w-2xl">
            <Badge tone="lime">
              <Sparkles size={14} />
              Nouvelle collection football
            </Badge>
            <h1 className="mt-5 text-5xl font-black leading-[0.95] text-white sm:text-6xl lg:text-7xl">
              KVN Footwear
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
              Tenues premium pour supporters et joueurs, disponibles en maillot seul ou pack complet,
              avec personnalisation sur demande.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="/catalogue" size="lg">
                Voir les maillots
                <ArrowRight size={19} />
              </LinkButton>
              <LinkButton href={`https://wa.me/${whatsappPhoneNumber}`} size="lg" variant="secondary">
                <MessageCircle size={19} />
                WhatsApp
              </LinkButton>
            </div>
            <div className="mt-9 grid grid-cols-3 gap-3 text-sm">
              {[
                ["24h", "Reponse rapide"],
                ["S-XXXL", "Tailles"],
                ["0", "Paiement en ligne"],
              ].map(([value, label]) => (
                <div className="rounded-lg border border-white/10 bg-[#10272b]/75 p-3" key={label}>
                  <p className="text-2xl font-black text-white">{value}</p>
                  <p className="mt-1 text-xs text-zinc-500">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10">
            <div className="relative min-h-[420px] overflow-hidden rounded-lg bg-[#081416] shadow-[0_0_90px_rgba(245,158,11,0.12)] sm:min-h-[520px]">
              {heroProducts.map((product, index) => {
                const image = product.images[0];
                const isActive = index === safeHeroIndex;

                return (
                  <div
                    aria-hidden={!isActive}
                    aria-label={product.name}
                    className={[
                      "absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-out",
                      isActive ? "opacity-100 scale-100" : "opacity-0 scale-[1.04]",
                    ].join(" ")}
                    key={product.id}
                    role="img"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.42)), url("${image.replace(/"/g, "%22")}")`,
                    }}
                  />
                );
              })}

              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="max-w-sm rounded-lg border border-amber-300/20 bg-[#071214]/85 p-4 backdrop-blur-md">
                  <p className="text-xs font-semibold uppercase text-amber-200">
                    {heroProduct.categoryId === "pack" ? "Pack populaire" : "Maillot populaire"}
                  </p>
                  <h2 className="mt-2 line-clamp-2 text-xl font-black text-white">{heroProduct.name}</h2>
                  <p className="mt-2 text-2xl font-black text-white">
                    {formatPrice(heroProduct.categoryId === "pack" ? heroProduct.packPrice : heroProduct.basePrice)}
                  </p>
                </div>
              </div>

              {heroProducts.length > 1 && (
                <div className="absolute bottom-5 right-5 flex gap-1.5">
                  {heroProducts.map((product, index) => (
                    <button
                      aria-label={`Voir ${product.name}`}
                      className={[
                        "h-2 rounded-full transition-all",
                        index === safeHeroIndex ? "w-8 bg-amber-300" : "w-2 bg-white/35 hover:bg-white/70",
                      ].join(" ")}
                      key={product.id}
                      onClick={() => setHeroIndex(index)}
                      type="button"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <HomeProductSection products={jerseys.length > 0 ? jerseys : storeProducts.slice(0, 8)} title="MAILLOTS" />
      <HomeProductSection products={packs} title="ENSEMBLES" tone="soft" />
      <HomeProductSection products={newProducts} title="NOUVELLE COLLECTION" />
      <HomeProductSection products={selectionProducts} title="SELECTIONS 2026" tone="soft" />

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="grid gap-5 rounded-lg border border-amber-300/20 bg-[#081416] p-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <h2 className="text-2xl font-black text-white">Commande sans paiement en ligne</h2>
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

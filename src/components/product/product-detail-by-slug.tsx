"use client";

import { useEffect, useState } from "react";
import { clientApi } from "@/lib/client-api";
import { Product } from "@/lib/types";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { LinkButton } from "@/components/ui/button";

type ProductDetailBySlugProps = {
  slug: string;
};

export function ProductDetailBySlug({ slug }: ProductDetailBySlugProps) {
  const [product, setProduct] = useState<Product | null | undefined>(undefined);

  useEffect(() => {
    clientApi
      .getProductBySlug(slug)
      .then(setProduct)
      .catch(() => setProduct(null));
  }, [slug]);

  if (product === undefined) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center text-zinc-400 sm:px-6">
        Chargement du produit...
      </section>
    );
  }

  if (!product) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-3xl font-black text-white">Produit introuvable</h1>
        <p className="mt-3 text-zinc-400">Ce maillot ne figure plus dans le catalogue.</p>
        <LinkButton className="mt-6" href="/catalogue" size="lg">
          Retour au catalogue
        </LinkButton>
      </section>
    );
  }

  return <ProductDetailClient product={product} />;
}

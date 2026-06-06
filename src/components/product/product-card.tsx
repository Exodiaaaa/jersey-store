import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getCategoryName, getTeamName } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { ProductMedia } from "@/components/product/product-media";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const startingPrice = product.categoryId === "pack" ? product.packPrice : product.basePrice;

  return (
    <article className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] transition hover:border-lime-300/35 hover:bg-white/[0.06]">
      <Link className="block" href={`/produit/${product.slug}`}>
        <ProductMedia
          className="rounded-none border-0"
          images={product.images}
          name={product.name}
          visual={product.visual}
        />
      </Link>
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="silver">{getCategoryName(product.categoryId)}</Badge>
          {product.isNew && (
            <Badge tone="lime">
              <Sparkles size={13} />
              Nouveau
            </Badge>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">{getTeamName(product.teamId)}</p>
          <h2 className="mt-1 line-clamp-2 min-h-12 text-base font-bold text-white">{product.name}</h2>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-zinc-500">À partir de</p>
            <p className="text-xl font-black text-white">{formatPrice(startingPrice)}</p>
          </div>
          <LinkButton href={`/produit/${product.slug}`} size="sm" variant="secondary">
            Détails
            <ArrowRight size={16} />
          </LinkButton>
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { getProductCategoryName, getProductPriceInfo, getProductTeamName } from "@/lib/catalog";
import { Product } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { ProductMedia } from "@/components/product/product-media";
import { PriceDisplay } from "@/components/product/price-display";

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className = "" }: ProductCardProps) {
  const priceInfo = getProductPriceInfo(product, product.categoryId === "pack" ? "pack" : "jersey");
  const hasPromo = Boolean(priceInfo.originalPrice);

  return (
    <article
      className={[
        "kvn-reveal kvn-card-lift group overflow-hidden rounded-[4px] bg-[#172625] shadow-[0_16px_42px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:bg-[#101d1c]",
        className,
      ].join(" ")}
    >
      <Link className="relative block" href={`/produit/${product.slug}`}>
        <ProductMedia
          className="rounded-none border-0 transition duration-500 group-hover:scale-[1.03]"
          images={product.images}
          name={product.name}
          visual={product.visual}
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {hasPromo && <Badge tone="silver">Sale</Badge>}
          {product.isNew && (
            <Badge tone="lime">
              <Sparkles size={13} />
              New
            </Badge>
          )}
        </div>
      </Link>
      <div className="space-y-4 p-4">
        <Badge tone="silver">{getProductCategoryName(product)}</Badge>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-white/42">{getProductTeamName(product)}</p>
          <h2 className="mt-1 line-clamp-2 min-h-12 text-base font-black uppercase leading-tight text-white">
            {product.name}
          </h2>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase text-white/42">A partir de</p>
            <PriceDisplay currentPrice={priceInfo.currentPrice} originalPrice={priceInfo.originalPrice} />
          </div>
          <LinkButton href={`/produit/${product.slug}`} size="sm">
            Commander
            <ArrowRight size={16} />
          </LinkButton>
        </div>
      </div>
    </article>
  );
}

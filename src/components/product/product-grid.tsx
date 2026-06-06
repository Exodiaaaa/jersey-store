import { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";

type ProductGridProps = {
  products: Product[];
  emptyLabel?: string;
};

export function ProductGrid({ products, emptyLabel = "Aucun produit trouvé." }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center text-zinc-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

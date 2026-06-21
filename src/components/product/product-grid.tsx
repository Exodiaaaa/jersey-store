import { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";

type ProductGridProps = {
  products: Product[];
  emptyLabel?: string;
};

export function ProductGrid({ products, emptyLabel = "Aucun produit trouve." }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-[4px] border border-white/12 bg-[#111318] p-8 text-center text-white/62">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

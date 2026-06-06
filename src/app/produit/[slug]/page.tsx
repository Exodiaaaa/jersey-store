import { products } from "@/data/catalog";
import { ProductDetailBySlug } from "@/components/product/product-detail-by-slug";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({ params }: PageProps<"/produit/[slug]">) {
  const { slug } = await params;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ProductDetailBySlug slug={slug} />
    </section>
  );
}

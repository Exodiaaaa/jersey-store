import { ProductForm } from "@/components/admin/product-form";

export default async function EditProductPage({ params }: PageProps<"/admin/produits/[id]">) {
  const { id } = await params;

  return <ProductForm productId={id} />;
}

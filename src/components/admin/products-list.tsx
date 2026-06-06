"use client";

import Link from "next/link";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { categories, teams } from "@/data/catalog";
import { clientApi } from "@/lib/client-api";
import { formatPrice } from "@/lib/format";
import { Category, Product, Team } from "@/lib/types";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ProductMedia } from "@/components/product/product-media";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export function ProductsList() {
  const [items, setItems] = useState<Product[]>([]);
  const [categoryItems, setCategoryItems] = useState<Category[]>(categories);
  const [teamItems, setTeamItems] = useState<Team[]>(teams);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  useEffect(() => {
    void Promise.all([clientApi.getProducts(), clientApi.getCategories(), clientApi.getTeams()]).then(
      ([nextProducts, nextCategories, nextTeams]) => {
        setItems(nextProducts);
        setCategoryItems(nextCategories);
        setTeamItems(nextTeams);
      },
    ).catch(() => undefined);
  }, []);

  const getCategoryLabel = (id: string) => categoryItems.find((category) => category.id === id)?.name ?? id;
  const getTeamLabel = (id: string) => teamItems.find((team) => team.id === id)?.name ?? id;

  const deleteProduct = async () => {
    if (!productToDelete) return;

    await clientApi.deleteProduct(productToDelete.id);
    setItems((current) => current.filter((product) => product.id !== productToDelete.id));
    setProductToDelete(null);
  };

  return (
    <div>
      <AdminPageHeader
        action={
          <LinkButton href="/admin/produits/nouveau">
            <Plus size={18} />
            Ajouter
          </LinkButton>
        }
        description="Ajoutez, modifiez ou supprimez les produits visibles dans le catalogue client."
        title="Produits"
      />
      <div className="grid gap-4">
        {items.map((product) => {
          const totalStock = product.sizes.reduce((sum, size) => sum + (product.stock[size] ?? 0), 0);

          return (
            <article
              className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[110px_1fr_auto]"
              key={product.id}
            >
              <ProductMedia className="aspect-square" images={product.images} name={product.name} visual={product.visual} />
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="silver">{getCategoryLabel(product.categoryId)}</Badge>
                  <Badge tone="blue">{getTeamLabel(product.teamId)}</Badge>
                  {product.allowFlocking && <Badge tone="lime">Flocage</Badge>}
                </div>
                <h2 className="mt-3 truncate text-lg font-black text-white">{product.name}</h2>
                <div className="mt-2 grid gap-2 text-sm text-zinc-400 sm:grid-cols-3">
                  <span>Maillot : {formatPrice(product.basePrice)}</span>
                  <span>Pack : {formatPrice(product.packPrice)}</span>
                  <span>Stock total : {totalStock}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {product.sizes.map((size) => (
                    <span
                      className="rounded border border-white/10 bg-zinc-950/70 px-2 py-1 text-xs font-semibold text-zinc-300"
                      key={size}
                    >
                      {size}: {product.stock[size] ?? 0}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 md:justify-end">
                <Link className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-200 transition hover:bg-white/[0.08]" href={`/admin/produits/${product.id}`}>
                  <Edit3 size={17} />
                </Link>
                <Button onClick={() => setProductToDelete(product)} size="icon" type="button" variant="danger">
                  <Trash2 size={17} />
                </Button>
              </div>
            </article>
          );
        })}
      </div>
      <ConfirmDialog
        confirmLabel="Supprimer"
        description={
          productToDelete
            ? `Voulez-vous vraiment supprimer "${productToDelete.name}" ? Cette action retirera le produit du catalogue.`
            : ""
        }
        isOpen={Boolean(productToDelete)}
        onCancel={() => setProductToDelete(null)}
        onConfirm={deleteProduct}
        title="Confirmer la suppression"
        tone="danger"
      />
    </div>
  );
}

"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductMedia } from "@/components/product/product-media";

export function CartView() {
  const { items, total, updateQuantity, removeItem } = useCart();
  const hasFlockingAdvance = items.some((item) => item.flocking.mode !== "none");

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-3xl font-black text-white">Panier vide</h1>
        <p className="mt-3 text-zinc-400">Ajoutez un maillot ou un pack pour préparer la commande WhatsApp.</p>
        <LinkButton className="mt-6" href="/catalogue" size="lg">
          Voir le catalogue
        </LinkButton>
      </section>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
      <div>
        <h1 className="text-3xl font-black text-white">Panier</h1>
        <div className="mt-6 grid gap-4">
          {items.map((item) => (
            <article
              className="grid gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-[120px_1fr_auto]"
              key={item.id}
            >
              <ProductMedia
                className="aspect-square"
                image={item.image}
                name={item.productName}
                visual={item.visual}
              />
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge tone="silver">{item.teamName}</Badge>
                  <Badge tone={item.flocking.mode === "none" ? "silver" : "lime"}>
                    {item.flocking.mode === "none" ? "Sans flocage" : "Flocage"}
                  </Badge>
                </div>
                <h2 className="text-lg font-bold text-white">{item.productName}</h2>
                <p className="text-sm text-zinc-400">
                  {item.type === "pack" ? "Maillot + short" : "Maillot seul"} · Taille {item.size}
                </p>
                {item.flocking.mode !== "none" && (
                  <div className="space-y-1 text-sm">
                    <p className="text-zinc-300">
                      {item.flocking.player ?? item.flocking.name} {item.flocking.number ? `#${item.flocking.number}` : ""}
                    </p>
                    <p className="font-semibold text-[#f5f7f9]">Avance demandee avant preparation.</p>
                  </div>
                )}
              </div>
              <div className="flex flex-row items-center justify-between gap-4 sm:flex-col sm:items-end">
                <p className="text-lg font-black text-white">{formatPrice(item.unitPrice * item.quantity)}</p>
                <div className="flex items-center gap-2">
                  <div className="inline-flex h-10 items-center rounded-lg border border-white/10 bg-zinc-950">
                    <button
                      aria-label={`Diminuer la quantite de ${item.productName}`}
                      className="grid h-10 w-9 place-items-center"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      type="button"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      aria-label={`Augmenter la quantite de ${item.productName}`}
                      className="grid h-10 w-9 place-items-center"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      type="button"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                  <Button
                    aria-label={`Supprimer ${item.productName} du panier`}
                    onClick={() => removeItem(item.id)}
                    size="icon"
                    type="button"
                    variant="danger"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <aside className="h-fit rounded-lg border border-white/10 bg-white/[0.04] p-5 lg:sticky lg:top-24">
        <h2 className="text-xl font-black text-white">Résumé</h2>
        <div className="mt-5 space-y-3 border-b border-white/10 pb-5 text-sm text-zinc-300">
          <div className="flex justify-between">
            <span>Produits</span>
            <span>{items.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Total</span>
            <strong className="text-white">{formatPrice(total)}</strong>
          </div>
        </div>
        {hasFlockingAdvance && (
          <p className="mt-4 rounded-lg border border-[#d9dde2]/25 bg-white/10 p-3 text-sm font-semibold text-[#f5f7f9]">
            Cette commande contient du flocage : une avance sera demandee avant preparation.
          </p>
        )}
        <LinkButton className="mt-5 w-full" href="/checkout" size="lg">
          Valider la commande
        </LinkButton>
      </aside>
    </section>
  );
}

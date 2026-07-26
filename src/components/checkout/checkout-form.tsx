"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, Send } from "lucide-react";
import { clientApi } from "@/lib/client-api";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Button, LinkButton } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";

export function CheckoutForm() {
  const { items, total, clearCart } = useCart();
  const hasFlockingAdvance = items.some((item) => item.flocking.mode !== "none");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [customer, setCustomer] = useState({
    fullName: "",
    phone: "",
    city: "",
    address: "",
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");
    try {
      const order = await clientApi.createOrder(items, customer);
      const whatsappUrl = buildWhatsAppUrl(order.whatsappMessage);
      clearCart();
      window.location.assign(whatsappUrl);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Impossible de valider la commande.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-3xl font-black text-white">Aucune commande</h1>
        <p className="mt-3 text-zinc-400">Le panier est vide pour le moment.</p>
        <LinkButton className="mt-6" href="/catalogue" size="lg">
          Voir les produits
        </LinkButton>
      </section>
    );
  }

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
      <form className="rounded-lg border border-white/10 bg-white/[0.04] p-5" onSubmit={handleSubmit}>
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white">Validation commande</h1>
          {hasFlockingAdvance && (
            <p className="mt-4 rounded-lg border border-amber-300/25 bg-amber-300/10 p-3 text-sm font-semibold text-amber-100">
              Flocage detecte : une avance est demandee avant preparation.
            </p>
          )}
          <p className="mt-2 text-sm text-zinc-400">La commande sera enregistrée puis envoyée vers WhatsApp.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet</Label>
            <Input
              id="fullName"
              onChange={(event) => setCustomer((value) => ({ ...value, fullName: event.target.value }))}
              placeholder="Nom client"
              required
              value={customer.fullName}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              onChange={(event) => setCustomer((value) => ({ ...value, phone: event.target.value }))}
              placeholder="+212 ..."
              required
              value={customer.phone}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">Ville</Label>
            <Input
              id="city"
              onChange={(event) => setCustomer((value) => ({ ...value, city: event.target.value }))}
              placeholder="Casablanca"
              required
              value={customer.city}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="address">Adresse</Label>
            <Textarea
              id="address"
              onChange={(event) => setCustomer((value) => ({ ...value, address: event.target.value }))}
              placeholder="Adresse complète"
              required
              value={customer.address}
            />
          </div>
        </div>
        <Button className="mt-6 w-full sm:w-auto" disabled={isSubmitting} size="lg" type="submit">
          <Send size={19} />
          {isSubmitting ? "Enregistrement..." : "Commander sur WhatsApp"}
        </Button>
        {submitError && (
          <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm font-semibold text-red-100">
            {submitError}
          </p>
        )}
      </form>
      <aside className="h-fit rounded-lg border border-white/10 bg-white/[0.04] p-5 lg:sticky lg:top-24">
        <h2 className="inline-flex items-center gap-2 text-xl font-black text-white">
          <MessageCircle size={20} />
          Récapitulatif
        </h2>
        <div className="mt-5 grid gap-4">
          {items.map((item) => (
            <div className="border-b border-white/10 pb-4" key={item.id}>
              <p className="font-bold text-white">{item.productName}</p>
              {item.flocking.mode !== "none" && (
                <p className="mt-2 text-sm font-semibold text-amber-100">Avance flocage requise.</p>
              )}
              <p className="mt-1 text-sm text-zinc-400">
                {item.quantity} × {item.size} · {item.type === "pack" ? "Pack" : "Maillot"}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between text-lg font-black text-white">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </aside>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { clientApi } from "@/lib/client-api";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { Order } from "@/lib/types";
import { LinkButton } from "@/components/ui/button";

export function ConfirmationClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!orderId) return;
    clientApi.getOrder(orderId).then(setOrder).catch(() => setOrder(null));
  }, [orderId]);

  const whatsappUrl = order ? buildWhatsAppUrl(order.whatsappMessage) : null;

  useEffect(() => {
    if (!whatsappUrl) return;

    const timeout = window.setTimeout(() => {
      window.location.href = whatsappUrl;
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [whatsappUrl]);

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="grid h-16 w-16 place-items-center rounded-lg border border-amber-300/35 bg-amber-300/12 text-amber-200">
        <CheckCircle2 size={34} />
      </div>
      <h1 className="mt-6 text-3xl font-black text-white">Commande enregistrée</h1>
      <p className="mt-3 text-zinc-400">
        Redirection vers WhatsApp avec le message de commande prérempli.
      </p>
      {order && <p className="mt-3 text-sm font-semibold text-zinc-300">Référence : {order.reference}</p>}
      {whatsappUrl && (
        <LinkButton className="mt-7" href={whatsappUrl} size="lg">
          <MessageCircle size={19} />
          Ouvrir WhatsApp
        </LinkButton>
      )}
    </section>
  );
}

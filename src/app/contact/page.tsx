import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { whatsappPhoneNumber } from "@/data/catalog";
import { LinkButton } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <div>
        <p className="text-sm font-semibold uppercase text-lime-200">Contact</p>
        <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">Commande rapide sur WhatsApp</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-zinc-400">
          Pour une question de taille, de stock ou de flocage, le vendeur peut répondre directement
          avant validation de la commande.
        </p>
        <LinkButton className="mt-7" href={`https://wa.me/${whatsappPhoneNumber}`} size="lg">
          <MessageCircle size={19} />
          Ouvrir WhatsApp
        </LinkButton>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          [Phone, "Téléphone", "+212 604 009 383"],
          [MessageCircle, "WhatsApp", "Commande et suivi"],
          [MapPin, "Livraison", "Toutes villes du Maroc"],
          [Mail, "Email", "contact@kvnfootwear.ma"],
        ].map(([Icon, title, value]) => (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5" key={String(title)}>
            <Icon className="text-lime-200" size={24} />
            <h2 className="mt-4 text-lg font-black text-white">{String(title)}</h2>
            <p className="mt-2 text-sm text-zinc-400">{String(value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

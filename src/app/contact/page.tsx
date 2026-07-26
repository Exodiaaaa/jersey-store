import { Camera, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { instagramUrl, whatsappPhoneNumber } from "@/data/catalog";
import { LinkButton } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d9dde2]">Contact</p>
        <h1 className="mt-3 text-5xl font-black uppercase leading-none text-white sm:text-6xl">
          Commande rapide sur WhatsApp
        </h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-white/64">
          Pour une question de taille, de disponibilite ou de flocage, le vendeur repond directement avant
          validation de la commande.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <LinkButton href={`https://wa.me/${whatsappPhoneNumber}`} size="lg">
            <MessageCircle size={19} />
            Ouvrir WhatsApp
          </LinkButton>
          <LinkButton href={instagramUrl} rel="noreferrer" size="lg" target="_blank" variant="secondary">
            <Camera size={19} />
            Instagram
          </LinkButton>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          [Phone, "Telephone", "+212 617-311976"],
          [MessageCircle, "WhatsApp", "Commande et suivi"],
          [Camera, "Instagram", "@kvn_wearfoots"],
          [MapPin, "Livraison", "Toutes villes du Maroc"],
          [Mail, "Email", "contact@kvnfootwear.ma"],
        ].map(([Icon, title, value]) => (
          <div className="rounded-[4px] border border-white/12 bg-[#111318] p-5" key={String(title)}>
            <Icon className="text-[#d9dde2]" size={24} />
            <h2 className="mt-4 text-lg font-black text-white">{String(title)}</h2>
            <p className="mt-2 text-sm text-white/58">{String(value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

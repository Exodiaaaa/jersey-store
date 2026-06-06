"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, MessageCircle, MapPin } from "lucide-react";
import { whatsappPhoneNumber } from "@/data/catalog";
import { Logo } from "@/components/ui/logo";

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="border-t border-cyan-100/10 bg-[#071214]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-md text-sm leading-6 text-zinc-400">
            Tenues de football soigneusement selectionnees, avec packs complets et personnalisation sur demande.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Boutique</h2>
          <div className="mt-4 grid gap-2 text-sm text-zinc-400">
            <Link className="hover:text-white" href="/catalogue">
              Catalogue
            </Link>
            <Link className="hover:text-white" href="/panier">
              Panier
            </Link>
            <Link className="hover:text-white" href="/contact">
              Contact
            </Link>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Contact</h2>
          <div className="mt-4 grid gap-3 text-sm text-zinc-400">
            <a className="inline-flex items-center gap-2 hover:text-white" href={`https://wa.me/${whatsappPhoneNumber}`}>
              <MessageCircle size={17} />
              WhatsApp
            </a>
            <span className="inline-flex items-center gap-2">
              <Camera size={17} />
              Instagram
            </span>
            <span className="inline-flex items-center gap-2">
              <MapPin size={17} />
              Livraison au Maroc
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

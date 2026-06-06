"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, ShieldCheck, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { whatsappPhoneNumber } from "@/data/catalog";
import { logoutAdmin } from "@/lib/admin-auth";
import { useCart } from "@/lib/cart-context";
import { buttonClassName } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

const navItems = [
  { href: "/", label: "Accueil" },
  { href: "/catalogue", label: "Catalogue" },
  { href: "/avis", label: "Avis clients" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { count } = useCart();

  useEffect(() => {
    if (!pathname.startsWith("/admin")) {
      logoutAdmin();
    }
  }, [pathname]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/86 backdrop-blur-xl">
      <div className="mx-auto flex h-18 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              className={[
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                pathname === item.href ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/8 hover:text-white",
              ].join(" ")}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link className={buttonClassName("secondary", "md")} href={`https://wa.me/${whatsappPhoneNumber}`}>
            <MessageCircle size={18} />
            WhatsApp
          </Link>
          <Link aria-label="Admin" className={buttonClassName("secondary", "icon")} href="/admin/login">
            <ShieldCheck size={18} />
          </Link>
          <Link className={buttonClassName("primary", "md", "relative")} href="/panier">
            <ShoppingBag size={18} />
            Panier
            {count > 0 && (
              <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-xs text-white">
                {count}
              </span>
            )}
          </Link>
        </div>

        <button
          aria-label="Menu"
          className={buttonClassName("secondary", "icon", "md:hidden")}
          onClick={() => setIsOpen((value) => !value)}
          type="button"
        >
          {isOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 px-4 py-4 md:hidden">
          <nav className="mx-auto grid max-w-7xl gap-2">
            {navItems.map((item) => (
              <Link
                className="rounded-lg px-3 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/8"
                href={item.href}
                key={item.href}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link className={buttonClassName("primary", "lg", "mt-2")} href="/panier">
              <ShoppingBag size={18} />
              Panier {count > 0 ? `(${count})` : ""}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

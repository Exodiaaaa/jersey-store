"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
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

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="kvn-site-header sticky top-0 z-40 border-b border-white/10 bg-[#090a0c]/92 backdrop-blur-xl">
      <div className="mx-auto grid h-20 w-full max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 md:hidden">
          <button
            aria-label="Menu"
            className={buttonClassName("ghost", "icon")}
            onClick={() => setIsOpen((value) => !value)}
            type="button"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link className={buttonClassName("ghost", "icon")} href="/catalogue">
            <Search size={19} />
          </Link>
        </div>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              className={[
                "rounded-[4px] px-3 py-2 text-sm font-black transition",
                pathname === item.href
                  ? "bg-[#d9dde2] text-[#060607]"
                  : "text-white/78 hover:bg-white/[0.08] hover:text-white",
              ].join(" ")}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="min-w-0 justify-self-center">
          <span className="hidden min-[360px]:inline-flex">
            <Logo />
          </span>
          <span className="inline-flex min-[360px]:hidden">
            <Logo compact />
          </span>
        </div>

        <div className="flex items-center justify-end gap-2">
          <span className="hidden md:block">
            <Link className={buttonClassName("secondary", "icon")} href="/catalogue">
              <Search size={18} />
            </Link>
          </span>
          <Link className={buttonClassName("primary", "md", "relative")} href="/panier">
            <ShoppingBag size={18} />
            <span className="hidden sm:inline">Panier</span>
            {count > 0 && (
              <span className="absolute right-0 top-0 grid h-5 min-w-5 translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-red-500 px-1 text-xs text-white">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-white/10 bg-[#111318] px-4 py-4 md:hidden">
          <nav className="mx-auto grid max-w-7xl gap-2">
            {navItems.map((item) => (
              <Link
                className="rounded-[4px] px-3 py-3 text-sm font-black text-white/86 hover:bg-white/[0.08]"
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

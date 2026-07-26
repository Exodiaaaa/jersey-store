"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Gauge,
  KeyRound,
  Layers3,
  LayoutTemplate,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBasket,
  Users,
} from "lucide-react";
import { PropsWithChildren, useState } from "react";
import { logoutAdmin } from "@/lib/admin-auth";
import { buttonClassName } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ChangePasswordDialog } from "@/components/admin/change-password-dialog";

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/admin/accueil", label: "Accueil", icon: LayoutTemplate },
  { href: "/admin/produits", label: "Produits", icon: Package },
  { href: "/admin/commandes", label: "Commandes", icon: ShoppingBasket },
  { href: "/admin/categories", label: "Categories", icon: Layers3 },
  { href: "/admin/equipes", label: "Equipes", icon: Users },
];

export function AdminShell({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const logout = async () => {
    setIsLoggingOut(true);
    const response = await logoutAdmin().catch(() => null);
    setIsLoggingOut(false);

    if (response?.ok) {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/10 bg-black/80 px-5 py-5 lg:block">
        <Logo />
        <nav className="mt-8 grid gap-1">
          {adminNav.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition",
                  active
                    ? "bg-amber-300 text-zinc-950"
                    : "text-zinc-300 hover:bg-white/[0.08] hover:text-white",
                ].join(" ")}
                href={item.href}
                key={item.href}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 grid gap-2">
          <button
            className={buttonClassName("ghost", "md", "w-full")}
            onClick={() => setIsPasswordDialogOpen(true)}
            type="button"
          >
            <KeyRound size={18} />
            Changer le mot de passe
          </button>
          <button
            className={buttonClassName("ghost", "md", "w-full")}
            disabled={isLoggingOut}
            onClick={() => void logout()}
            type="button"
          >
            <LogOut size={18} />
            {isLoggingOut ? "Deconnexion..." : "Deconnexion"}
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/86 px-4 py-3 backdrop-blur-xl sm:px-6 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <Logo compact />
            <div className="flex items-center gap-2">
              <button
                aria-label="Changer le mot de passe"
                className={buttonClassName("secondary", "icon")}
                onClick={() => setIsPasswordDialogOpen(true)}
                type="button"
              >
                <KeyRound size={16} />
              </button>
              <button
                aria-label="Deconnexion"
                className={buttonClassName("secondary", "icon")}
                disabled={isLoggingOut}
                onClick={() => void logout()}
                type="button"
              >
                <LogOut size={16} />
              </button>
              <Link className={buttonClassName("secondary", "sm")} href="/admin/dashboard">
                <ShieldCheck size={16} />
                Admin
              </Link>
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200"
                  href={item.href}
                  key={item.href}
                >
                  <Icon size={15} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
      <ChangePasswordDialog isOpen={isPasswordDialogOpen} onClose={() => setIsPasswordDialogOpen(false)} />
    </div>
  );
}

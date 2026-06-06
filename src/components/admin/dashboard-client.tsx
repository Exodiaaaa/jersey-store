"use client";

import Link from "next/link";
import { BarChart3, Clock, Package, ShoppingBasket, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { clientApi } from "@/lib/client-api";
import { formatDate, formatPrice } from "@/lib/format";
import { orderStatusLabels, orderStatusTones } from "@/lib/status";
import { DashboardStats } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export function DashboardClient() {
  const [stats, setStats] = useState<DashboardStats>({
    orderCount: 0,
    estimatedRevenue: 0,
    topProducts: [],
    recentOrders: [],
  });

  useEffect(() => {
    clientApi.getDashboardStats().then(setStats).catch(() => undefined);
  }, []);

  const statCards = [
    { label: "Commandes", value: stats.orderCount, icon: ShoppingBasket },
    { label: "CA estimé", value: formatPrice(stats.estimatedRevenue), icon: Wallet },
    { label: "Produits top", value: stats.topProducts.length, icon: Package },
  ];

  return (
    <div>
      <AdminPageHeader
        description="Vue rapide des commandes enregistrées depuis le site et envoyées vers WhatsApp."
        title="Dashboard"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5" key={card.label}>
              <Icon className="text-amber-200" size={24} />
              <p className="mt-4 text-sm text-zinc-500">{card.label}</p>
              <p className="mt-1 text-3xl font-black text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <h2 className="inline-flex items-center gap-2 text-xl font-black text-white">
            <BarChart3 size={21} />
            Produits les plus commandés
          </h2>
          <div className="mt-5 grid gap-3">
            {stats.topProducts.length === 0 && <p className="text-sm text-zinc-500">Aucune commande pour le moment.</p>}
            {stats.topProducts.map((product) => (
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-zinc-950/60 p-3" key={product.name}>
                <span className="text-sm font-semibold text-zinc-200">{product.name}</span>
                <Badge tone="lime">{product.quantity} pcs</Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <h2 className="inline-flex items-center gap-2 text-xl font-black text-white">
            <Clock size={21} />
            Commandes récentes
          </h2>
          <div className="mt-5 grid gap-3">
            {stats.recentOrders.length === 0 && <p className="text-sm text-zinc-500">Aucune commande enregistrée.</p>}
            {stats.recentOrders.map((order) => (
              <Link
                className="grid gap-2 rounded-lg border border-white/10 bg-zinc-950/60 p-3 transition hover:border-amber-300/30"
                href={`/admin/commandes/${order.id}`}
                key={order.id}
              >
                <div className="flex items-center justify-between gap-3">
                  <strong className="text-white">{order.reference}</strong>
                  <Badge tone={orderStatusTones[order.status]}>{orderStatusLabels[order.status]}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm text-zinc-400">
                  <span>{order.customer.fullName}</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

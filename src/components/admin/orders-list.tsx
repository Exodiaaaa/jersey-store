"use client";

import Link from "next/link";
import { Eye, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { clientApi } from "@/lib/client-api";
import { canChangeOrderStatus, orderStatusLabels, orderStatuses, orderStatusTones } from "@/lib/status";
import { formatDate, formatPrice } from "@/lib/format";
import { Order, OrderStatus } from "@/lib/types";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/field";

export function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingStatus, setPendingStatus] = useState<{ order: Order; status: OrderStatus } | null>(null);

  useEffect(() => {
    clientApi.getOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    const currentOrder = orders.find((order) => order.id === orderId);
    if (!currentOrder || currentOrder.status === status || !canChangeOrderStatus(currentOrder.status, status)) {
      return;
    }

    setPendingStatus({ order: currentOrder, status });
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    const updated = await clientApi.updateOrderStatus(pendingStatus.order.id, pendingStatus.status);
    setOrders((current) => current.map((order) => (order.id === pendingStatus.order.id ? updated : order)));
    setPendingStatus(null);
  };

  return (
    <div>
      <AdminPageHeader
        description="Toutes les commandes validées côté client sont enregistrées ici, même après redirection WhatsApp."
        title="Commandes"
      />
      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
        <div className="grid gap-4 p-4">
          {orders.length === 0 && <p className="p-4 text-sm text-zinc-500">Aucune commande enregistrée.</p>}
          {orders.map((order) => (
            <article className="grid gap-4 rounded-lg border border-white/10 bg-zinc-950/60 p-4 lg:grid-cols-[1fr_180px_180px_90px]" key={order.id}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-white">{order.reference}</strong>
                  <Badge tone={orderStatusTones[order.status]}>{orderStatusLabels[order.status]}</Badge>
                  {order.items.some((item) => item.flocking.mode !== "none") && <Badge tone="lime">Avance flocage</Badge>}
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  {order.customer.fullName} · {order.customer.city} · {formatDate(order.createdAt)}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {order.items.length} ligne(s), total {formatPrice(order.total)}
                </p>
              </div>
              <div className="text-sm text-zinc-300">
                <p className="font-semibold text-white">{order.customer.phone}</p>
                <p className="mt-1 line-clamp-2">{order.customer.address}</p>
              </div>
              <Select
                aria-label="Statut commande"
                onChange={(event) => handleStatusChange(order.id, event.target.value as OrderStatus)}
                value={order.status}
              >
                {orderStatuses.map((status) => (
                  <option disabled={!canChangeOrderStatus(order.status, status)} key={status} value={status}>
                    {orderStatusLabels[status]}
                  </option>
                ))}
              </Select>
              <div className="flex items-center gap-2 lg:justify-end">
                <a
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-200 transition hover:bg-white/[0.08]"
                  href={`https://wa.me/?text=${encodeURIComponent(order.whatsappMessage)}`}
                  target="_blank"
                >
                  <MessageCircle size={17} />
                </a>
                <Link
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-zinc-200 transition hover:bg-white/[0.08]"
                  href={`/admin/commandes/${order.id}`}
                >
                  <Eye size={17} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
      <ConfirmDialog
        confirmLabel="Changer le statut"
        description={
          pendingStatus
            ? `Voulez-vous passer la commande ${pendingStatus.order.reference} de "${orderStatusLabels[pendingStatus.order.status]}" a "${orderStatusLabels[pendingStatus.status]}" ?`
            : ""
        }
        isOpen={Boolean(pendingStatus)}
        onCancel={() => setPendingStatus(null)}
        onConfirm={confirmStatusChange}
        title="Confirmer le changement de statut"
      />
    </div>
  );
}

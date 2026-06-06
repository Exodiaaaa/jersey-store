"use client";

import { useEffect, useMemo, useState } from "react";
import { clientApi } from "@/lib/client-api";
import { canChangeOrderStatus, orderStatusLabels, orderStatuses, orderStatusTones } from "@/lib/status";
import { formatDate, formatPrice } from "@/lib/format";
import { Order, OrderStatus } from "@/lib/types";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select } from "@/components/ui/field";

type OrderDetailProps = {
  orderId: string;
};

export function OrderDetail({ orderId }: OrderDetailProps) {
  const [order, setOrder] = useState<Order | undefined>();
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const selectedOrder = useMemo(() => order, [order]);

  useEffect(() => {
    clientApi.getOrder(orderId).then(setOrder).catch(() => setOrder(undefined));
  }, [orderId]);

  if (!selectedOrder) {
    return (
      <div>
        <AdminPageHeader title="Commande introuvable" />
        <LinkButton href="/admin/commandes">Retour commandes</LinkButton>
      </div>
    );
  }

  const changeStatus = (status: OrderStatus) => {
    if (selectedOrder.status === status || !canChangeOrderStatus(selectedOrder.status, status)) {
      return;
    }

    setPendingStatus(status);
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;

    const updated = await clientApi.updateOrderStatus(selectedOrder.id, pendingStatus);
    setOrder(updated);
    setPendingStatus(null);
  };

  return (
    <div>
      <AdminPageHeader
        action={
          <LinkButton href="/admin/commandes" variant="secondary">
            Retour
          </LinkButton>
        }
        description={`${selectedOrder.customer.fullName} - ${formatDate(selectedOrder.createdAt)}`}
        title={selectedOrder.reference}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone={orderStatusTones[selectedOrder.status]}>{orderStatusLabels[selectedOrder.status]}</Badge>
          {selectedOrder.items.some((item) => item.flocking.mode !== "none") && (
            <Badge tone="lime">Avance flocage</Badge>
          )}
        </div>
      </AdminPageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          {selectedOrder.items.map((item) => (
            <article className="rounded-lg border border-white/10 bg-white/[0.04] p-4" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-white">{item.productName}</h2>
                  <p className="mt-1 text-sm text-zinc-400">
                    {item.teamName} - Taille {item.size} - {item.type === "pack" ? "Maillot + short" : "Maillot seul"}
                  </p>
                </div>
                <p className="text-lg font-black text-white">{formatPrice(item.lineTotal)}</p>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-zinc-300 sm:grid-cols-2">
                <span>Quantite : {item.quantity}</span>
                <span>Prix unitaire : {formatPrice(item.unitPrice)}</span>
                <span>Flocage : {item.flocking.mode === "none" ? "Non" : "Oui"}</span>
                {item.flocking.mode !== "none" && <span>Avance flocage : A demander avant preparation</span>}
                {item.flocking.name && <span>Nom : {item.flocking.name}</span>}
                {item.flocking.player && <span>Nom / joueur : {item.flocking.player}</span>}
                {item.flocking.number && <span>Numero : {item.flocking.number}</span>}
                {item.flocking.note && <span className="sm:col-span-2">Remarque : {item.flocking.note}</span>}
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-lg border border-white/10 bg-white/[0.04] p-5 lg:sticky lg:top-8">
          <h2 className="text-xl font-black text-white">Client</h2>
          <div className="mt-4 grid gap-2 text-sm text-zinc-300">
            <span>Nom : {selectedOrder.customer.fullName}</span>
            <span>Telephone : {selectedOrder.customer.phone}</span>
            <span>Ville : {selectedOrder.customer.city}</span>
            <span>Adresse : {selectedOrder.customer.address}</span>
          </div>

          <div className="mt-5 border-t border-white/10 pt-5">
            <label className="block text-sm font-semibold text-zinc-200" htmlFor="order-status">
              Statut
            </label>
            <Select
              className="mt-2"
              id="order-status"
              onChange={(event) => changeStatus(event.target.value as OrderStatus)}
              value={selectedOrder.status}
            >
              {orderStatuses.map((status) => (
                <option disabled={!canChangeOrderStatus(selectedOrder.status, status)} key={status} value={status}>
                  {orderStatusLabels[status]}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5 text-lg font-black text-white">
            <span>Total</span>
            <span>{formatPrice(selectedOrder.total)}</span>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        confirmLabel="Changer le statut"
        description={
          pendingStatus
            ? `Voulez-vous passer la commande ${selectedOrder.reference} de "${orderStatusLabels[selectedOrder.status]}" a "${orderStatusLabels[pendingStatus]}" ?`
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

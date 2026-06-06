import { OrderStatus } from "@/lib/types";

export const orderStatusFlow: OrderStatus[] = ["new", "confirmed", "preparing", "ready", "delivered"];
export const orderStatuses: OrderStatus[] = [...orderStatusFlow, "cancelled"];

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: "Nouvelle",
  confirmed: "Confirmée",
  preparing: "En préparation",
  ready: "Prête",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const orderStatusTones: Record<OrderStatus, "lime" | "silver" | "red" | "blue"> = {
  new: "lime",
  confirmed: "blue",
  preparing: "silver",
  ready: "blue",
  delivered: "lime",
  cancelled: "red",
};

export function canChangeOrderStatus(currentStatus: OrderStatus, nextStatus: OrderStatus) {
  if (currentStatus === nextStatus) {
    return true;
  }

  if (currentStatus === "cancelled" || currentStatus === "delivered") {
    return false;
  }

  if (nextStatus === "cancelled") {
    return true;
  }

  const currentIndex = orderStatusFlow.indexOf(currentStatus);
  const nextIndex = orderStatusFlow.indexOf(nextStatus);

  return currentIndex !== -1 && nextIndex !== -1 && nextIndex > currentIndex;
}

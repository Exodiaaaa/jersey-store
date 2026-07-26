import { whatsappPhoneNumber } from "@/data/catalog";
import { formatPrice } from "@/lib/format";
import { CartItem, Customer, Order } from "@/lib/types";

export function buildWhatsAppMessage(items: CartItem[], customer: Customer, total: number) {
  const hasFlockingAdvance = items.some((item) => item.flocking.mode !== "none");
  const lines = [
    "Bonjour, je veux passer cette commande :",
    "",
    ...items.flatMap((item, index) => [
      `Produit ${index + 1} : ${item.productName}`,
      `Equipe : ${item.teamName}`,
      `Type : ${item.type === "pack" ? "Maillot + short" : "Maillot seul"}`,
      `Taille : ${item.size}`,
      `Flocage : ${item.flocking.mode === "none" ? "Non" : "Oui"}`,
      ...(item.flocking.name ? [`Nom : ${item.flocking.name}`] : []),
      ...(item.flocking.number ? [`Numero : ${item.flocking.number}`] : []),
      ...(item.flocking.player ? [`Nom / joueur : ${item.flocking.player}`] : []),
      ...(item.flocking.note ? [`Remarque : ${item.flocking.note}`] : []),
      ...(item.flocking.mode !== "none" ? ["Avance flocage : Oui, a confirmer avant preparation"] : []),
      `Quantite : ${item.quantity}`,
      `Prix : ${formatPrice(item.unitPrice * item.quantity)}`,
      "",
    ]),
    `Nom client : ${customer.fullName}`,
    `Telephone : ${customer.phone}`,
    `Ville : ${customer.city}`,
    `Adresse : ${customer.address}`,
    `Total : ${formatPrice(total)}`,
    ...(hasFlockingAdvance
      ? ["", "Note : une avance est demandee avant preparation pour toute commande avec flocage."]
      : []),
  ];

  return lines.join("\n");
}

export function buildOrderWhatsAppMessage(order: Order) {
  return buildWhatsAppMessage(order.items, order.customer, order.total);
}

export function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${whatsappPhoneNumber}?text=${encodeURIComponent(message)}`;
}

export function normalizeWhatsAppPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, "").replace(/^00/, "");

  if (digits.startsWith("0")) {
    return `212${digits.slice(1)}`;
  }

  if (/^[5-7]\d{8}$/.test(digits)) {
    return `212${digits}`;
  }

  return digits;
}

export function buildCustomerWhatsAppUrl(message: string, phone: string) {
  return `https://wa.me/${normalizeWhatsAppPhoneNumber(phone)}?text=${encodeURIComponent(message)}`;
}

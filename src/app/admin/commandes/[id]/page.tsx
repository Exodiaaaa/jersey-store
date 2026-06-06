import { OrderDetail } from "@/components/admin/order-detail";

export default async function AdminOrderDetailPage({ params }: PageProps<"/admin/commandes/[id]">) {
  const { id } = await params;

  return <OrderDetail orderId={id} />;
}

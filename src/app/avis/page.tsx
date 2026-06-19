import Link from "next/link";
import { MessageCircle, Star } from "lucide-react";
import { whatsappPhoneNumber } from "@/data/catalog";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { ProductMedia } from "@/components/product/product-media";

export const dynamic = "force-dynamic";

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          className={value <= rating ? "fill-[#d7ff45] text-[#d7ff45]" : "text-white/24"}
          key={value}
          size={16}
        />
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  const reviews = await prisma.productReview.findMany({
    include: {
      product: {
        select: {
          images: {
            orderBy: { sortOrder: "asc" },
            select: { url: true },
          },
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.78fr_0.22fr] lg:items-start">
        <div>
          <Badge tone="lime">Avis clients</Badge>
          <h1 className="mt-4 text-5xl font-black uppercase leading-none text-white sm:text-6xl">
            Les retours des clients KVN Footwear
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-white/62">
            Les avis sont lies aux produits du catalogue : qualite, taille, flocage et experience
            de commande.
          </p>
        </div>

        <div className="rounded-[4px] border border-white/12 bg-[#172625] p-5">
          <p className="text-sm font-semibold text-white/56">Note moyenne</p>
          <div className="mt-3 flex items-center gap-3">
            <RatingStars rating={Math.round(averageRating)} />
            <span className="text-2xl font-black text-white">
              {reviews.length > 0 ? averageRating.toFixed(1) : "-"} / 5
            </span>
          </div>
          <p className="mt-2 text-sm text-white/44">{reviews.length} avis publie(s)</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="mt-8 rounded-[4px] border border-white/12 bg-[#172625] p-8 text-center">
          <p className="text-lg font-bold text-white">Aucun avis pour le moment.</p>
          <p className="mt-2 text-sm text-white/58">
            Les premiers retours clients apparaitront ici apres publication sur les fiches produit.
          </p>
          <LinkButton className="mt-5" href="/catalogue">
            Voir le catalogue
          </LinkButton>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review) => {
            const image = review.product.images[0]?.url;

            return (
              <article
                className="overflow-hidden rounded-[4px] border border-white/12 bg-[#172625] transition hover:border-[#d7ff45]/35 hover:bg-[#101d1c]"
                key={review.id}
              >
                <Link href={`/produit/${review.product.slug}`}>
                  <ProductMedia
                    className="aspect-[16/10] rounded-none border-0"
                    image={image}
                    images={image ? [image] : []}
                    name={review.product.name}
                  />
                </Link>
                <div className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="line-clamp-2 text-base font-black text-white">
                        {review.product.name}
                      </h2>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatDate(review.createdAt.toISOString())}
                      </p>
                    </div>
                    <RatingStars rating={review.rating} />
                  </div>
                  <p className="text-sm font-bold text-[#ecff9c]">{review.customerName}</p>
                  <p className="text-sm leading-6 text-zinc-300">{review.comment}</p>
                  <Link
                    className="inline-flex text-sm font-semibold text-zinc-200 transition hover:text-[#d7ff45]"
                    href={`/produit/${review.product.slug}`}
                  >
                    Voir le produit
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-10 grid gap-4 rounded-[4px] border border-white/12 bg-[#101d1c] p-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <h2 className="text-xl font-black text-white">Une question avant de commander ?</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Le client peut verifier les avis, choisir son maillot, puis finaliser la commande sur
            WhatsApp.
          </p>
        </div>
        <LinkButton href={`https://wa.me/${whatsappPhoneNumber}`} target="_blank" size="lg">
          <MessageCircle size={19} />
          WhatsApp
        </LinkButton>
      </div>
    </section>
  );
}

"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Send, Star } from "lucide-react";
import { clientApi } from "@/lib/client-api";
import { formatDate } from "@/lib/format";
import { ProductReview } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";

type ProductReviewsProps = {
  productId: string;
};

function RatingStars({
  rating,
  interactive = false,
  onSelect,
}: {
  rating: number;
  interactive?: boolean;
  onSelect?: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => {
        const isActive = value <= rating;
        const Icon = (
          <Star
            className={isActive ? "fill-[#d9dde2] text-[#d9dde2]" : "text-white/24"}
            size={interactive ? 22 : 16}
          />
        );

        if (!interactive) {
          return <span key={value}>{Icon}</span>;
        }

        return (
          <button
            aria-label={`${value} etoile${value > 1 ? "s" : ""}`}
            className="rounded p-1 transition hover:bg-white/[0.08]"
            key={value}
            onClick={() => onSelect?.(value)}
            type="button"
          >
            {Icon}
          </button>
        );
      })}
    </div>
  );
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    clientApi.getProductReviews(productId).then(setReviews).catch(() => setReviews([]));
  }, [productId]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  }, [reviews]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const review = await clientApi.createProductReview(productId, {
        customerName,
        rating,
        comment,
      });
      setReviews((current) => [review, ...current]);
      setCustomerName("");
      setRating(5);
      setComment("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-10 rounded-[4px] border border-white/12 bg-[#111318] p-5">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-[#d9dde2]">Avis clients</p>
          <h2 className="mt-2 text-2xl font-black text-white">Ce que pensent les clients</h2>
        </div>
        <div className="rounded-[4px] border border-white/10 bg-[#060607] p-3">
          <div className="flex items-center gap-3">
            <RatingStars rating={Math.round(averageRating)} />
            <span className="text-sm font-bold text-white">
              {reviews.length > 0 ? averageRating.toFixed(1) : "-"} / 5
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500">{reviews.length} avis</p>
        </div>
      </div>

      <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="review-name">Nom</Label>
            <Input
              id="review-name"
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Votre nom"
              required
              value={customerName}
            />
          </div>
          <div className="space-y-2">
            <Label>Note</Label>
            <div className="flex h-11 items-center rounded-lg border border-white/10 bg-[#060607] px-2">
              <RatingStars interactive onSelect={setRating} rating={rating} />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="review-comment">Commentaire</Label>
          <Textarea
            id="review-comment"
            onChange={(event) => setComment(event.target.value)}
            placeholder="Qualite, taille, livraison, flocage..."
            required
            value={comment}
          />
        </div>
        <Button className="w-full sm:w-fit" disabled={isSubmitting} type="submit">
          <Send size={18} />
          {isSubmitting ? "Publication..." : "Publier l'avis"}
        </Button>
      </form>

      <div className="mt-6 grid gap-3">
        {reviews.length === 0 && (
          <p className="rounded-[4px] border border-white/10 bg-[#060607] p-4 text-sm text-white/48">
            Aucun avis pour ce produit pour le moment.
          </p>
        )}
        {reviews.map((review) => (
          <article className="rounded-[4px] border border-white/10 bg-[#060607] p-4" key={review.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white">{review.customerName}</h3>
                <p className="mt-1 text-xs text-zinc-500">{formatDate(review.createdAt)}</p>
              </div>
              <RatingStars rating={review.rating} />
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{review.comment}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

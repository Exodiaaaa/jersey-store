import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ProductReview, ProductReviewInput } from "@/lib/types";

function mapReview(review: {
  id: number;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: Date;
}): ProductReview {
  return {
    ...review,
    createdAt: review.createdAt.toISOString(),
  };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const reviews = await prisma.productReview.findMany({
    orderBy: { createdAt: "desc" },
    where: { productId: id },
  });

  return NextResponse.json(reviews.map(mapReview));
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json()) as ProductReviewInput;
  const rating = Math.max(1, Math.min(5, Number(body.rating)));

  const review = await prisma.productReview.create({
    data: {
      productId: id,
      customerName: body.customerName.trim(),
      rating,
      comment: body.comment.trim(),
    },
  });

  return NextResponse.json(mapReview(review), { status: 201 });
}

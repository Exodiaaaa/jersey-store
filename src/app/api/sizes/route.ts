import { NextResponse } from "next/server";
import { sizes as catalogSizes } from "@/data/catalog";
import { prisma } from "@/lib/prisma";
import { Size } from "@/lib/types";

export async function GET() {
  const sizes = await prisma.sizeOption.findMany({ orderBy: { id: "asc" } });
  const sortedSizes = sizes
    .map((size) => size.id)
    .filter((size): size is Size => catalogSizes.includes(size as Size))
    .sort((a, b) => catalogSizes.indexOf(a) - catalogSizes.indexOf(b));

  return NextResponse.json(sortedSizes.length > 0 ? sortedSizes : catalogSizes);
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { sizes: Size[] };

  await prisma.$transaction(async (tx) => {
    await tx.sizeOption.deleteMany({
      where: {
        id: {
          notIn: body.sizes,
        },
      },
    });
    for (const size of body.sizes) {
      await tx.sizeOption.upsert({
        create: { id: size },
        update: { id: size },
        where: { id: size },
      });
    }
  });

  return NextResponse.json(body.sizes);
}

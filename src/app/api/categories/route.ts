import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Category } from "@/lib/types";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const category = (await request.json()) as Category;
  const savedCategory = await prisma.category.create({ data: category });
  return NextResponse.json(savedCategory, { status: 201 });
}

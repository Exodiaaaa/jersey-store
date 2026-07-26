import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { Category } from "@/lib/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const category = (await request.json()) as Category;
  const savedCategory = await prisma.category.update({
    data: {
      name: category.name,
      description: category.description,
    },
    where: { id },
  });

  return NextResponse.json(savedCategory);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  await prisma.category.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

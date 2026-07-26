import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { Team } from "@/lib/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  const team = (await request.json()) as Team;
  const savedTeam = await prisma.team.update({
    data: {
      name: team.name,
      league: team.league,
      country: team.country,
      accent: team.accent,
    },
    where: { id },
  });

  return NextResponse.json(savedTeam);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { id } = await params;
  await prisma.team.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

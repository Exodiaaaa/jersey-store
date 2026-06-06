import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Team } from "@/lib/types";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.team.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}

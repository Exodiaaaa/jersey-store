import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { Team } from "@/lib/types";

export async function GET() {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(teams);
}

export async function POST(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const team = (await request.json()) as Team;
  const savedTeam = await prisma.team.create({ data: team });
  return NextResponse.json(savedTeam, { status: 201 });
}

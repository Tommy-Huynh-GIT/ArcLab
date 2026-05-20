import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const handedness = body.handedness === "LEFT" ? "LEFT" : "RIGHT";

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Profile name must be at least 2 characters." },
      { status: 400 },
    );
  }

  const profile = await prisma.profile.create({
    data: { name, handedness },
  });

  return NextResponse.json({ profile }, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  const payload = body && typeof body === "object" ? body : {};
  const name =
    "name" in payload && typeof payload.name === "string"
      ? payload.name.trim()
      : "";
  const handedness =
    "handedness" in payload && payload.handedness === "LEFT" ? "LEFT" : "RIGHT";

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

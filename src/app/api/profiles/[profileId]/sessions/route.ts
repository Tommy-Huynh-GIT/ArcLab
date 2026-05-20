import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{
    profileId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { profileId } = await context.params;
  const trimmedProfileId = profileId.trim();

  if (!trimmedProfileId) {
    return NextResponse.json(
      { error: "Profile id is required." },
      { status: 400 },
    );
  }

  try {
    const sessions = await prisma.session.findMany({
      where: { profileId: trimmedProfileId },
      orderBy: { createdAt: "desc" },
      include: {
        report: {
          include: {
            metrics: true,
            keyFrames: true,
          },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json(
      { error: "Unable to load sessions." },
      { status: 500 },
    );
  }
}

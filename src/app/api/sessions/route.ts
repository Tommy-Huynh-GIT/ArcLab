import { NextResponse } from "next/server";
import { scoreFreeThrow } from "@/features/scoring/scoringEngine";
import type { PoseAnalysisInput } from "@/features/pose/types";
import { prisma } from "@/lib/db";

type SessionPayload = {
  profileId: string;
  title: string;
  pose: PoseAnalysisInput;
};

function payloadRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" && !Array.isArray(body)
    ? (body as Record<string, unknown>)
    : {};
}

function validatePayload(body: unknown): { payload?: SessionPayload; error?: string } {
  const payload = payloadRecord(body);
  const profileId =
    typeof payload.profileId === "string" ? payload.profileId.trim() : "";
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const pose = payload.pose;

  if (!profileId) {
    return { error: "Profile id is required." };
  }

  if (!title) {
    return { error: "Session title is required." };
  }

  if (!pose || typeof pose !== "object" || Array.isArray(pose)) {
    return { error: "Pose payload is required." };
  }

  return {
    payload: {
      profileId,
      title,
      pose: pose as PoseAnalysisInput,
    },
  };
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

  const { payload, error } = validatePayload(body);

  if (!payload) {
    return NextResponse.json({ error }, { status: 400 });
  }

  let report;

  try {
    report = scoreFreeThrow(payload.pose);
  } catch (scoringError) {
    return NextResponse.json(
      {
        error:
          scoringError instanceof Error
            ? scoringError.message
            : "Unable to score this pose.",
      },
      { status: 400 },
    );
  }

  try {
    const session = await prisma.session.create({
      data: {
        profileId: payload.profileId,
        title: payload.title,
        report: {
          create: {
            overallScore: report.overallScore,
            rank: report.rank,
            summary: report.summary,
            metrics: {
              create: report.metrics.map((metric) => ({
                name: metric.name,
                score: metric.score,
                value: metric.value,
                feedback: metric.feedback,
                drill: metric.drill,
              })),
            },
            keyFrames: {
              create: report.keyFrames.map((keyFrame) => ({
                label: keyFrame.label,
                timestampMs: keyFrame.timestampMs,
              })),
            },
          },
        },
      },
      include: {
        report: {
          include: {
            metrics: true,
            keyFrames: true,
          },
        },
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Unable to save analyzed session." },
      { status: 500 },
    );
  }
}

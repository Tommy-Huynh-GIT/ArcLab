import { beforeEach, describe, expect, it, vi } from "vitest";
import { balancedFreeThrow } from "@/features/scoring/__fixtures__/freeThrowLandmarks";

const sessionCreate = vi.fn();
const scoreFreeThrow = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      create: sessionCreate,
    },
  },
}));

vi.mock("@/features/scoring/scoringEngine", () => ({
  scoreFreeThrow,
}));

describe("/api/sessions", () => {
  beforeEach(() => {
    vi.resetModules();
    sessionCreate.mockReset();
    scoreFreeThrow.mockReset();
  });

  it("scores and persists a session with nested report records", async () => {
    const report = {
      overallScore: 87,
      rank: "A",
      summary: "Strong balance and follow-through.",
      metrics: [
        {
          name: "stanceWidth",
          label: "Stance width",
          score: 91,
          value: 1.22,
          feedback: "Base is stable.",
          drill: "Form shooting holds.",
        },
      ],
      keyFrames: [{ label: "release", timestampMs: 700 }],
    };
    const savedSession = {
      id: "session_1",
      profileId: "profile_1",
      title: "Morning reps",
      report: {
        id: "report_1",
        ...report,
      },
    };
    scoreFreeThrow.mockReturnValue(report);
    sessionCreate.mockResolvedValue(savedSession);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          profileId: "profile_1",
          title: " Morning reps ",
          pose: balancedFreeThrow,
        }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ session: savedSession });
    expect(scoreFreeThrow).toHaveBeenCalledWith(balancedFreeThrow);
    expect(sessionCreate).toHaveBeenCalledWith({
      data: {
        profileId: "profile_1",
        title: "Morning reps",
        report: {
          create: {
            overallScore: 87,
            rank: "A",
            summary: "Strong balance and follow-through.",
            metrics: {
              create: [
                {
                  name: "stanceWidth",
                  score: 91,
                  value: 1.22,
                  feedback: "Base is stable.",
                  drill: "Form shooting holds.",
                },
              ],
            },
            keyFrames: {
              create: [{ label: "release", timestampMs: 700 }],
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
  });

  it("rejects malformed payloads before scoring", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          profileId: "",
          title: "Morning reps",
          pose: balancedFreeThrow,
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Profile id is required.",
    });
    expect(scoreFreeThrow).not.toHaveBeenCalled();
    expect(sessionCreate).not.toHaveBeenCalled();
  });

  it("returns scoring validation errors without persisting", async () => {
    scoreFreeThrow.mockImplementation(() => {
      throw new Error("At least four pose frames are required for scoring.");
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          profileId: "profile_1",
          title: "Morning reps",
          pose: { handedness: "RIGHT", frames: [] },
        }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "At least four pose frames are required for scoring.",
    });
    expect(sessionCreate).not.toHaveBeenCalled();
  });
});

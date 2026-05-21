import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      findMany,
    },
  },
}));

describe("/api/profiles/[profileId]/sessions", () => {
  beforeEach(() => {
    vi.resetModules();
    findMany.mockReset();
  });

  it("returns profile sessions ordered newest first with nested reports", async () => {
    const sessions = [
      {
        id: "session_2",
        profileId: "profile_1",
        title: "Evening reps",
        report: {
          id: "report_2",
          overallScore: 91,
          rank: "S",
          metrics: [{ id: "metric_1", name: "stanceWidth" }],
          keyFrames: [{ id: "keyframe_1", label: "release" }],
        },
      },
    ];
    findMany.mockResolvedValue(sessions);

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/profiles/profile_1/sessions"),
      { params: Promise.resolve({ profileId: "profile_1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ sessions });
    expect(findMany).toHaveBeenCalledWith({
      where: { profileId: "profile_1" },
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
  });

  it("returns a controlled error when sessions cannot be loaded", async () => {
    findMany.mockRejectedValue(new Error("database unavailable"));

    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/profiles/profile_1/sessions"),
      { params: Promise.resolve({ profileId: "profile_1" }) },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Unable to load sessions.",
    });
  });
});

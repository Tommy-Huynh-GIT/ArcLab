import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.fn();
const create = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    profile: {
      findMany,
      create,
    },
  },
}));

describe("/api/profiles", () => {
  beforeEach(() => {
    findMany.mockReset();
    create.mockReset();
  });

  it("returns profiles ordered by newest first", async () => {
    const profiles = [
      { id: "profile_1", name: "Maya", handedness: "RIGHT" },
    ];
    findMany.mockResolvedValue(profiles);

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ profiles });
    expect(findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("rejects profile names shorter than two characters", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/profiles", {
        method: "POST",
        body: JSON.stringify({ name: " A " }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Profile name must be at least 2 characters.",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("creates a right-handed profile by default", async () => {
    const profile = { id: "profile_2", name: "Jordan", handedness: "RIGHT" };
    create.mockResolvedValue(profile);

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/profiles", {
        method: "POST",
        body: JSON.stringify({ name: " Jordan " }),
      }),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ profile });
    expect(create).toHaveBeenCalledWith({
      data: { name: "Jordan", handedness: "RIGHT" },
    });
  });
});

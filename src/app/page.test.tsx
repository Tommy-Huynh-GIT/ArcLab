import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { balancedFreeThrow } from "@/features/scoring/__fixtures__/freeThrowLandmarks";
import Home from "./page";

const extractPoseLandmarks = vi.hoisted(() => vi.fn());

vi.mock("@/features/pose/extractPoseLandmarks", () => ({
  extractPoseLandmarks,
}));

describe("Home", () => {
  let revokeObjectURL: ReturnType<typeof vi.fn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    extractPoseLandmarks.mockReset();
    fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/api/profiles") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              profiles: [
                { id: "profile_1", name: "Maya", handedness: "LEFT" },
                { id: "profile_2", name: "Jordan", handedness: "RIGHT" },
              ],
            }),
        });
      }

      if (url === "/api/sessions") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              session: {
                id: "session_1",
                title: "maya-free-throw.webm",
                report: {
                  id: "report_1",
                  overallScore: 88,
                  rank: "A",
                  summary: "Strong balance and follow-through.",
                  metrics: [
                    {
                      id: "metric_1",
                      name: "stanceWidth",
                      score: 91,
                      value: 1.22,
                      feedback: "Base is stable.",
                      drill: "Form shooting holds.",
                    },
                  ],
                  keyFrames: [
                    { id: "keyframe_1", label: "release", timestampMs: 700 },
                  ],
                },
              },
            }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:profile-upload-preview"),
    });
    revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("clears the selected upload when switching profiles", async () => {
    render(<Home />);

    fireEvent.click(await screen.findByRole("button", { name: /maya/i }));
    fireEvent.change(screen.getByLabelText(/free throw clip/i), {
      target: {
        files: [
          new File(["video"], "maya-free-throw.webm", {
            type: "video/webm",
          }),
        ],
      },
    });

    expect(screen.getByText("maya-free-throw.webm")).toBeInTheDocument();
    expect(
      screen.getByLabelText(/selected free throw preview/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /jordan/i }));

    expect(screen.queryByText("maya-free-throw.webm")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/selected free throw preview/i),
    ).not.toBeInTheDocument();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:profile-upload-preview");
  });

  it("extracts pose landmarks, saves the session, and renders the saved report", async () => {
    extractPoseLandmarks.mockResolvedValue(balancedFreeThrow);
    render(<Home />);

    fireEvent.click(await screen.findByRole("button", { name: /maya/i }));
    fireEvent.change(screen.getByLabelText(/free throw clip/i), {
      target: {
        files: [
          new File(["video"], "maya-free-throw.webm", {
            type: "video/webm",
          }),
        ],
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^analyze$/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: "profile_1",
          title: "maya-free-throw.webm",
          pose: balancedFreeThrow,
        }),
      }),
    );

    expect(extractPoseLandmarks).toHaveBeenCalledWith(expect.any(HTMLVideoElement), {
      handedness: "LEFT",
    });
    expect(await screen.findByText("Strong balance and follow-through.")).toBeInTheDocument();
    expect(screen.getByText("88")).toBeInTheDocument();
  });
});

import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { balancedFreeThrow } from "@/features/scoring/__fixtures__/freeThrowLandmarks";
import Home from "./page";

const extractPoseLandmarks = vi.hoisted(() => vi.fn());

const savedHistorySession = {
  id: "session_history",
  title: "Archived reps",
  createdAt: "2026-05-19T15:00:00.000Z",
  report: {
    id: "report_history",
    overallScore: 76,
    rank: "B",
    summary: "Archived session report.",
    metrics: [
      {
        id: "metric_history",
        name: "releaseAngle",
        score: 74,
        value: 48,
        feedback: "Release is a little flat.",
        drill: "High arc form shots.",
      },
    ],
    keyFrames: [],
  },
};

const savedAnalysisSession = {
  id: "session_1",
  title: "maya-free-throw.webm",
  createdAt: "2026-05-20T15:00:00.000Z",
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
};

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
              session: savedAnalysisSession,
            }),
        });
      }

      if (url === "/api/profiles/profile_1/sessions") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sessions: [savedHistorySession] }),
        });
      }

      if (url === "/api/profiles/profile_2/sessions") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sessions: [] }),
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

  it("shows API errors without leaving the saving status visible", async () => {
    extractPoseLandmarks.mockResolvedValue(balancedFreeThrow);
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/api/profiles") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              profiles: [
                { id: "profile_1", name: "Maya", handedness: "LEFT" },
              ],
            }),
        });
      }

      if (url === "/api/profiles/profile_1/sessions") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sessions: [] }),
        });
      }

      return Promise.resolve({
        ok: false,
        json: () =>
          Promise.resolve({
            error: "At least four pose frames are required for scoring.",
          }),
      });
    });

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

    expect(
      await screen.findAllByText("At least four pose frames are required for scoring."),
    ).toHaveLength(2);
    expect(screen.queryByText("Saving coaching report...")).not.toBeInTheDocument();
    expect(screen.queryByText("Extracting pose landmarks...")).not.toBeInTheDocument();
  });

  it("shows session history after selecting a profile and renders the selected saved report", async () => {
    render(<Home />);

    fireEvent.click(await screen.findByRole("button", { name: /maya/i }));
    fireEvent.click(await screen.findByRole("button", { name: /archived reps/i }));

    expect(await screen.findByText("Archived session report.")).toBeInTheDocument();
    expect(screen.getByText("76")).toBeInTheDocument();
  });

  it("refreshes session history after a new analysis is saved", async () => {
    extractPoseLandmarks.mockResolvedValue(balancedFreeThrow);
    fetchMock.mockImplementation((input: RequestInfo | URL) => {
      const url = input.toString();

      if (url === "/api/profiles") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              profiles: [
                { id: "profile_1", name: "Maya", handedness: "LEFT" },
              ],
            }),
        });
      }

      if (url === "/api/profiles/profile_1/sessions") {
        const matchingHistoryCalls = fetchMock.mock.calls.filter(
          ([calledInput]) =>
            calledInput.toString() === "/api/profiles/profile_1/sessions",
        );
        const sessions =
          matchingHistoryCalls.length > 1
            ? [savedAnalysisSession, savedHistorySession]
            : [savedHistorySession];

        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sessions }),
        });
      }

      if (url === "/api/sessions") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ session: savedAnalysisSession }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<Home />);

    fireEvent.click(await screen.findByRole("button", { name: /maya/i }));
    expect(await screen.findByText("Archived reps")).toBeInTheDocument();

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

    expect(
      await screen.findByRole("button", { name: /maya-free-throw.webm/i }),
    ).toBeInTheDocument();
  });

  it("shows extraction errors without leaving the extracting status visible", async () => {
    extractPoseLandmarks.mockRejectedValue(new Error("No pose detected."));
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

    expect(await screen.findAllByText("No pose detected.")).toHaveLength(2);
    expect(screen.queryByText("Extracting pose landmarks...")).not.toBeInTheDocument();
    expect(screen.queryByText("Saving coaching report...")).not.toBeInTheDocument();
  });
});

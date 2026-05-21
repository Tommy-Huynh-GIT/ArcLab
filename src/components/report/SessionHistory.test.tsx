import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionHistory } from "./SessionHistory";
import type { SavedSessionReport } from "./ReportSummary";

const session: SavedSessionReport = {
  id: "session_1",
  title: "Morning reps",
  createdAt: "2026-05-20T15:00:00.000Z",
  report: {
    id: "report_1",
    overallScore: 87,
    rank: "A",
    summary: "Strong balance and follow-through.",
    metrics: [],
    keyFrames: [],
  },
};

function okResponse(body: unknown) {
  return {
    ok: true,
    json: () => Promise.resolve(body),
  };
}

function errorResponse(body: unknown) {
  return {
    ok: false,
    json: () => Promise.resolve(body),
  };
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

describe("SessionHistory", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows loading, then renders saved sessions with score details and dates", async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ sessions: [session] }));
    vi.stubGlobal("fetch", fetchMock);

    render(<SessionHistory profileId="profile_1" />);

    expect(screen.getByText("Loading saved sessions...")).toBeInTheDocument();
    expect(await screen.findByText("Morning reps")).toBeInTheDocument();
    expect(screen.getByText("Rank A")).toBeInTheDocument();
    expect(screen.getByText("Score 87")).toBeInTheDocument();
    expect(screen.getByText(/May 20, 2026/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/profiles/profile_1/sessions");
  });

  it("shows an empty state when the profile has no saved sessions", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ sessions: [] })));

    render(<SessionHistory profileId="profile_empty" />);

    expect(
      await screen.findByText("No saved sessions yet."),
    ).toBeInTheDocument();
  });

  it("shows an API error state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(errorResponse({ error: "Unable to load sessions." })),
    );

    render(<SessionHistory profileId="profile_1" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load sessions.",
    );
  });

  it("cleans up stale profile state and refetches when profileId changes", async () => {
    const firstRequest = deferred<unknown>();
    const secondRequest = deferred<unknown>();
    const staleSession = { ...session, id: "stale_session", title: "Stale reps" };
    const nextSession = { ...session, id: "next_session", title: "Evening reps" };
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(<SessionHistory profileId="profile_1" />);

    rerender(<SessionHistory profileId="profile_2" />);
    secondRequest.resolve(okResponse({ sessions: [nextSession] }));
    firstRequest.resolve(okResponse({ sessions: [staleSession] }));

    expect(await screen.findByText("Evening reps")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByText("Stale reps")).not.toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/profiles/profile_1/sessions",
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/profiles/profile_2/sessions",
    );
  });

  it("calls onSelectSession when a saved session is selected", async () => {
    const onSelectSession = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse({ sessions: [session] })));

    render(
      <SessionHistory profileId="profile_1" onSelectSession={onSelectSession} />,
    );

    fireEvent.click(await screen.findByRole("button", { name: /morning reps/i }));

    expect(onSelectSession).toHaveBeenCalledWith(session);
  });
});

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReportSummary, type SavedSessionReport } from "./ReportSummary";

const session: SavedSessionReport = {
  id: "session_1",
  title: "Morning reps",
  createdAt: "2026-05-20T15:00:00.000Z",
  report: {
    id: "report_1",
    overallScore: 87,
    rank: "A",
    summary: "Strong balance and follow-through.",
    metrics: [
      {
        id: "metric_1",
        name: "stanceWidth",
        label: "Stance width",
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

describe("ReportSummary", () => {
  it("renders the saved report score, coaching feedback, drills, and keyframes", () => {
    render(<ReportSummary session={session} />);

    expect(screen.getByRole("heading", { name: /morning reps/i })).toBeInTheDocument();
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("Strong balance and follow-through.")).toBeInTheDocument();
    expect(screen.getByText("Stance width")).toBeInTheDocument();
    expect(screen.queryByText("stanceWidth")).not.toBeInTheDocument();
    expect(screen.getByText("Base is stable.")).toBeInTheDocument();
    expect(screen.getByText("Form shooting holds.")).toBeInTheDocument();
    expect(screen.getByText("release at 0.7s")).toBeInTheDocument();
  });
});

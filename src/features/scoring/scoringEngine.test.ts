import { describe, expect, it } from "vitest";
import type { PoseAnalysisInput } from "@/features/pose/types";
import { balancedFreeThrow } from "./__fixtures__/freeThrowLandmarks";
import { scoreFreeThrow } from "./scoringEngine";

describe("scoreFreeThrow", () => {
  it("returns five metrics, keyframes, and a strong rank for a balanced free throw", () => {
    const report = scoreFreeThrow(balancedFreeThrow);

    expect(report.metrics.map((metric) => metric.name)).toEqual([
      "stanceWidth",
      "kneeAlignment",
      "elbowAlignment",
      "armExtension",
      "followThrough",
    ]);
    expect(report.keyFrames.map((frame) => frame.label)).toEqual([
      "setup",
      "dip",
      "release",
      "followThrough",
    ]);
    expect(report.overallScore).toBeGreaterThanOrEqual(75);
    expect(["A", "S"]).toContain(report.rank);
  });

  it("throws a clear error when fewer than four frames are available", () => {
    const tooFewFrames: PoseAnalysisInput = {
      ...balancedFreeThrow,
      frames: balancedFreeThrow.frames.slice(0, 3),
    };

    expect(() => scoreFreeThrow(tooFewFrames)).toThrow(
      "At least four pose frames are required for scoring.",
    );
  });

  it("throws a clear error naming a low-visibility landmark", () => {
    const lowVisibilityElbow: PoseAnalysisInput = {
      ...balancedFreeThrow,
      frames: balancedFreeThrow.frames.map((frame) => ({
        ...frame,
        landmarks: frame.landmarks.map((landmark) =>
          landmark.name === "right_elbow"
            ? { ...landmark, visibility: 0.2 }
            : landmark,
        ),
      })),
    };

    expect(() => scoreFreeThrow(lowVisibilityElbow)).toThrow(
      "Missing visible landmark: right_elbow",
    );
  });
});

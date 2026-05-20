import { describe, expect, it } from "vitest";
import type { PoseAnalysisInput } from "@/features/pose/types";
import { balancedFreeThrow } from "./__fixtures__/freeThrowLandmarks";
import { scoreFreeThrow } from "./scoringEngine";

function withLandmark(
  input: PoseAnalysisInput,
  landmarkName: string,
  updates: { x?: number; y?: number; visibility?: number },
): PoseAnalysisInput {
  return {
    ...input,
    frames: input.frames.map((frame) => ({
      ...frame,
      landmarks: frame.landmarks.map((landmark) =>
        landmark.name === landmarkName ? { ...landmark, ...updates } : landmark,
      ),
    })),
  };
}

function metricScore(input: PoseAnalysisInput, metricName: string) {
  return scoreFreeThrow(input).metrics.find(
    (metric) => metric.name === metricName,
  );
}

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

  it("penalizes symmetric knee collapse by comparing each knee to its foot line", () => {
    const collapsedKnees: PoseAnalysisInput = {
      ...balancedFreeThrow,
      frames: balancedFreeThrow.frames.map((frame) =>
        frame.timestampMs === 350
          ? {
              ...frame,
              landmarks: frame.landmarks.map((landmark) => {
                if (landmark.name === "left_knee") {
                  return { ...landmark, x: 0.5 };
                }

                if (landmark.name === "right_knee") {
                  return { ...landmark, x: 0.5 };
                }

                return landmark;
              }),
            }
          : frame,
      ),
    };

    const kneeMetric = metricScore(collapsedKnees, "kneeAlignment");

    expect(kneeMetric?.score).toBeLessThan(60);
    expect(kneeMetric?.feedback).toMatch(/knees/i);
    expect(kneeMetric?.feedback).toMatch(/feet|ankles/i);
    expect(kneeMetric?.drill).toMatch(/band|track|pause/i);
  });

  it("uses corrective feedback and drills for weak metric scores", () => {
    const narrowStance = withLandmark(balancedFreeThrow, "right_ankle", {
      x: 0.47,
    });

    const stanceMetric = metricScore(narrowStance, "stanceWidth");

    expect(stanceMetric?.score).toBeLessThan(60);
    expect(stanceMetric?.feedback).toMatch(/narrow|wider|stance/i);
    expect(stanceMetric?.drill).toMatch(/mark|feet|shoulder/i);
  });

  it("scores a plausible left-handed shot using the left arm path", () => {
    const leftHanded: PoseAnalysisInput = {
      handedness: "LEFT",
      frames: balancedFreeThrow.frames.map((frame) => ({
        ...frame,
        landmarks: frame.landmarks.map((landmark) => {
          const mirroredName = landmark.name.startsWith("left_")
            ? landmark.name.replace("left_", "right_")
            : landmark.name.replace("right_", "left_");

          return {
            ...landmark,
            name: mirroredName as typeof landmark.name,
            x: Number((1 - landmark.x).toFixed(3)),
          };
        }),
      })),
    };

    const report = scoreFreeThrow(leftHanded);

    expect(report.overallScore).toBeGreaterThanOrEqual(75);
    expect(["A", "S"]).toContain(report.rank);
    expect(report.summary).toMatch(/left-handed/i);
  });

  it("throws a clear validation error for non-finite coordinates", () => {
    const invalidCoordinate = withLandmark(balancedFreeThrow, "left_wrist", {
      x: Number.NaN,
    });

    expect(() => scoreFreeThrow(invalidCoordinate)).toThrow(
      "Invalid coordinate for left_wrist in frame 0.",
    );
  });

  it("throws a clear validation error for out-of-range normalized coordinates", () => {
    const outOfRangeCoordinate = withLandmark(balancedFreeThrow, "left_wrist", {
      y: 1.2,
    });

    expect(() => scoreFreeThrow(outOfRangeCoordinate)).toThrow(
      "Normalized coordinate out of range for left_wrist in frame 0.",
    );
  });

  it("throws a clear validation error for duplicate frame landmarks", () => {
    const duplicateLandmark: PoseAnalysisInput = {
      ...balancedFreeThrow,
      frames: balancedFreeThrow.frames.map((frame, index) =>
        index === 0
          ? {
              ...frame,
              landmarks: [...frame.landmarks, frame.landmarks[0]],
            }
          : frame,
      ),
    };

    expect(() => scoreFreeThrow(duplicateLandmark)).toThrow(
      "Duplicate landmark left_shoulder in frame 0.",
    );
  });

  it("throws a clear validation error for unordered timestamps", () => {
    const unorderedTimestamps: PoseAnalysisInput = {
      ...balancedFreeThrow,
      frames: balancedFreeThrow.frames.map((frame, index) =>
        index === 2 ? { ...frame, timestampMs: 200 } : frame,
      ),
    };

    expect(() => scoreFreeThrow(unorderedTimestamps)).toThrow(
      "Pose frame timestamps must be strictly increasing.",
    );
  });

  it("throws a clear validation error for invalid handedness", () => {
    const invalidHandedness = {
      ...balancedFreeThrow,
      handedness: "AMBIDEXTROUS",
    } as unknown as PoseAnalysisInput;

    expect(() => scoreFreeThrow(invalidHandedness)).toThrow(
      "Handedness must be LEFT or RIGHT.",
    );
  });

  it("throws a clear validation error for tiny shoulder width", () => {
    const tinyShoulders = withLandmark(
      withLandmark(balancedFreeThrow, "left_shoulder", { x: 0.5 }),
      "right_shoulder",
      { x: 0.501 },
    );

    expect(() => scoreFreeThrow(tinyShoulders)).toThrow(
      "Shoulder width is too small to score stance reliably.",
    );
  });

  it("returns finite scores and values for a valid report", () => {
    const report = scoreFreeThrow(balancedFreeThrow);

    expect(Number.isFinite(report.overallScore)).toBe(true);
    for (const metric of report.metrics) {
      expect(Number.isFinite(metric.score)).toBe(true);
      expect(Number.isFinite(metric.value)).toBe(true);
    }
  });
});

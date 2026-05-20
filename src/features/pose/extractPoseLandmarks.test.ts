import { describe, expect, it } from "vitest";
import { __normalizePoseLandmarksForTest } from "./extractPoseLandmarks";

describe("__normalizePoseLandmarksForTest", () => {
  it("maps MediaPipe pose landmark indexes to ArcLab landmark names", () => {
    const mediaPipeLandmarks = Array.from({ length: 33 }, (_, index) => ({
      x: index / 100,
      y: index / 200,
      visibility: index === 15 ? undefined : 0.9,
    }));

    expect(__normalizePoseLandmarksForTest(mediaPipeLandmarks)).toEqual([
      { name: "left_shoulder", x: 0.11, y: 0.055, visibility: 0.9 },
      { name: "right_shoulder", x: 0.12, y: 0.06, visibility: 0.9 },
      { name: "left_elbow", x: 0.13, y: 0.065, visibility: 0.9 },
      { name: "right_elbow", x: 0.14, y: 0.07, visibility: 0.9 },
      { name: "left_wrist", x: 0.15, y: 0.075, visibility: 1 },
      { name: "right_wrist", x: 0.16, y: 0.08, visibility: 0.9 },
      { name: "left_hip", x: 0.23, y: 0.115, visibility: 0.9 },
      { name: "right_hip", x: 0.24, y: 0.12, visibility: 0.9 },
      { name: "left_knee", x: 0.25, y: 0.125, visibility: 0.9 },
      { name: "right_knee", x: 0.26, y: 0.13, visibility: 0.9 },
      { name: "left_ankle", x: 0.27, y: 0.135, visibility: 0.9 },
      { name: "right_ankle", x: 0.28, y: 0.14, visibility: 0.9 },
    ]);
  });

  it("drops a frame when a required landmark is missing", () => {
    const incompleteLandmarks = Array.from({ length: 16 }, (_, index) => ({
      x: index / 100,
      y: index / 200,
      visibility: 0.8,
    }));

    expect(__normalizePoseLandmarksForTest(incompleteLandmarks)).toBeNull();
  });
});

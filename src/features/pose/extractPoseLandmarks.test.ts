import { describe, expect, it } from "vitest";
import {
  __createCachedPoseLandmarkerForTest,
  __normalizePoseLandmarksForTest,
  __POSE_ASSET_URLS_FOR_TEST,
  __sampleTimestampsForTest,
} from "./extractPoseLandmarks";

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

describe("pose extraction asset URLs", () => {
  it("pins the MediaPipe WASM package URL to the installed package version", () => {
    expect(__POSE_ASSET_URLS_FOR_TEST.wasm).toContain(
      "@mediapipe/tasks-vision@0.10.35/wasm",
    );
    expect(__POSE_ASSET_URLS_FOR_TEST.wasm).not.toContain("@latest");
  });

  it("keeps model URL ownership explicit", () => {
    expect(__POSE_ASSET_URLS_FOR_TEST.model).toContain("pose_landmarker_lite.task");
    expect(__POSE_ASSET_URLS_FOR_TEST.model).not.toContain("/latest/");
  });
});

describe("__sampleTimestampsForTest", () => {
  it("samples the final frame below the video duration to avoid seeking EOF", () => {
    expect(__sampleTimestampsForTest(1000, 5)).toEqual([0, 250, 500, 749, 999]);
  });
});

describe("__createCachedPoseLandmarkerForTest", () => {
  it("retries initialization after a rejected load", async () => {
    const firstFailure = new Error("Transient MediaPipe load failure.");
    const landmarker = { detectForVideo: () => ({ landmarks: [] }) };
    let attempts = 0;
    const getLandmarker = __createCachedPoseLandmarkerForTest(async () => {
      attempts += 1;

      if (attempts === 1) {
        throw firstFailure;
      }

      return landmarker;
    });

    await expect(getLandmarker()).rejects.toThrow(firstFailure);
    await expect(getLandmarker()).resolves.toBe(landmarker);
    expect(attempts).toBe(2);
  });
});

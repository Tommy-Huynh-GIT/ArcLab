"use client";

import type {
  NormalizedLandmark,
  PoseAnalysisInput,
  PoseFrame,
  PoseLandmarkName,
} from "./types";

type MediaPipePoseLandmark = {
  x: number;
  y: number;
  visibility?: number;
};

type PoseLandmarkerInstance = {
  detectForVideo: (
    videoFrame: HTMLVideoElement,
    timestampMs: number,
  ) => {
    landmarks: MediaPipePoseLandmark[][];
  };
};

type ExtractPoseLandmarksOptions = {
  handedness: PoseAnalysisInput["handedness"];
  sampleCount?: number;
  minimumFrames?: number;
};

const DEFAULT_SAMPLE_COUNT = 12;
const DEFAULT_MINIMUM_FRAMES = 4;
const WASM_ASSET_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";

const landmarkIndexMap = [
  [11, "left_shoulder"],
  [12, "right_shoulder"],
  [13, "left_elbow"],
  [14, "right_elbow"],
  [15, "left_wrist"],
  [16, "right_wrist"],
  [23, "left_hip"],
  [24, "right_hip"],
  [25, "left_knee"],
  [26, "right_knee"],
  [27, "left_ankle"],
  [28, "right_ankle"],
] satisfies Array<[number, PoseLandmarkName]>;

let poseLandmarkerPromise: Promise<PoseLandmarkerInstance> | null = null;

async function getPoseLandmarker() {
  if (!poseLandmarkerPromise) {
    poseLandmarkerPromise = import("@mediapipe/tasks-vision").then(
      async ({ FilesetResolver, PoseLandmarker }) => {
        const vision = await FilesetResolver.forVisionTasks(WASM_ASSET_PATH);

        return PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_PATH,
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });
      },
    );
  }

  return poseLandmarkerPromise;
}

function normalizePoseLandmarks(
  landmarks: MediaPipePoseLandmark[],
): NormalizedLandmark[] | null {
  const normalized = landmarkIndexMap.map(([index, name]) => {
    const landmark = landmarks[index];

    if (!landmark) {
      return null;
    }

    return {
      name,
      x: clampNormalizedCoordinate(landmark.x),
      y: clampNormalizedCoordinate(landmark.y),
      visibility: landmark.visibility ?? 1,
    };
  });

  if (normalized.some((landmark) => landmark === null)) {
    return null;
  }

  return normalized as NormalizedLandmark[];
}

function clampNormalizedCoordinate(value: number) {
  return Math.min(1, Math.max(0, value));
}

function sampleTimestamps(durationMs: number, sampleCount: number) {
  if (sampleCount <= 1) {
    return [0];
  }

  return Array.from({ length: sampleCount }, (_, index) =>
    Math.round((durationMs / (sampleCount - 1)) * index),
  );
}

async function seekVideo(video: HTMLVideoElement, timestampMs: number) {
  const targetTimeSeconds = timestampMs / 1000;

  if (Math.abs(video.currentTime - targetTimeSeconds) < 0.001) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener("seeked", handleSeeked);
      video.removeEventListener("error", handleError);
    };
    const handleSeeked = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Unable to seek the selected video for pose extraction."));
    };

    video.addEventListener("seeked", handleSeeked, { once: true });
    video.addEventListener("error", handleError, { once: true });
    video.currentTime = targetTimeSeconds;
  });
}

function assertLoadedVideo(video: HTMLVideoElement) {
  if (video.readyState < HTMLMediaElement.HAVE_METADATA) {
    throw new Error("Video metadata must be loaded before extracting pose landmarks.");
  }

  if (!Number.isFinite(video.duration) || video.duration <= 0) {
    throw new Error("Video duration must be available before extracting pose landmarks.");
  }
}

export async function extractPoseLandmarks(
  video: HTMLVideoElement,
  options: ExtractPoseLandmarksOptions,
): Promise<PoseAnalysisInput> {
  assertLoadedVideo(video);

  const sampleCount = options.sampleCount ?? DEFAULT_SAMPLE_COUNT;
  const minimumFrames = options.minimumFrames ?? DEFAULT_MINIMUM_FRAMES;
  const poseLandmarker = await getPoseLandmarker();
  const frames: PoseFrame[] = [];

  for (const timestampMs of sampleTimestamps(video.duration * 1000, sampleCount)) {
    await seekVideo(video, timestampMs);

    const result = poseLandmarker.detectForVideo(video, timestampMs);
    const landmarks = result.landmarks[0];
    const normalizedLandmarks = landmarks
      ? normalizePoseLandmarks(landmarks)
      : null;

    if (normalizedLandmarks) {
      frames.push({
        timestampMs,
        landmarks: normalizedLandmarks,
      });
    }
  }

  if (frames.length < minimumFrames) {
    throw new Error(
      `No pose detected in enough frames. Collected ${frames.length} of ${minimumFrames} required pose frames.`,
    );
  }

  return {
    handedness: options.handedness,
    frames,
  };
}

export const __normalizePoseLandmarksForTest = normalizePoseLandmarks;

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
const MEDIAPIPE_TASKS_VISION_VERSION = "0.10.35";
const WASM_ASSET_PATH =
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_TASKS_VISION_VERSION}/wasm`;
const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
let nextMediaPipeTimestampMs = 0;

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

function createCachedPoseLandmarker(
  loadPoseLandmarker: () => Promise<PoseLandmarkerInstance>,
) {
  let cachedPromise: Promise<PoseLandmarkerInstance> | null = null;

  return async () => {
    if (!cachedPromise) {
      cachedPromise = loadPoseLandmarker().catch((error) => {
        cachedPromise = null;
        throw error;
      });
    }

    return cachedPromise;
  };
}

const getPoseLandmarker = createCachedPoseLandmarker(async () => {
  const { FilesetResolver, PoseLandmarker } = await import(
    "@mediapipe/tasks-vision"
  );
  const vision = await FilesetResolver.forVisionTasks(WASM_ASSET_PATH);

  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: MODEL_ASSET_PATH,
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });
});

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
  const maxTimestampMs = Math.max(0, durationMs - 1);

  if (sampleCount <= 1) {
    return [0];
  }

  return Array.from({ length: sampleCount }, (_, index) =>
    Math.round((maxTimestampMs / (sampleCount - 1)) * index),
  );
}

function mediaPipeTimestampsFor(
  videoTimestampsMs: number[],
  nextTimestampMs: number,
) {
  const timestamps = videoTimestampsMs.map(
    (timestampMs) => nextTimestampMs + timestampMs,
  );
  const lastTimestamp = timestamps.at(-1) ?? nextTimestampMs;

  return {
    timestamps,
    next: Math.max(nextTimestampMs, lastTimestamp + 1),
  };
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

function hasUsableVideoFrame(video: HTMLVideoElement) {
  return (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0
  );
}

async function waitForUsableVideoFrame(video: HTMLVideoElement) {
  if (hasUsableVideoFrame(video)) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener("loadeddata", handleLoadedFrame);
      video.removeEventListener("canplay", handleLoadedFrame);
      video.removeEventListener("error", handleError);
    };
    const handleLoadedFrame = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Unable to decode a frame from the selected video."));
    };

    video.addEventListener("loadeddata", handleLoadedFrame, { once: true });
    video.addEventListener("canplay", handleLoadedFrame, { once: true });
    video.addEventListener("error", handleError, { once: true });
  });

  if (!hasUsableVideoFrame(video)) {
    throw new Error("Video frame data is not ready for pose extraction.");
  }
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
  const videoTimestampsMs = sampleTimestamps(video.duration * 1000, sampleCount);
  const mediaPipeTiming = mediaPipeTimestampsFor(
    videoTimestampsMs,
    nextMediaPipeTimestampMs,
  );
  nextMediaPipeTimestampMs = mediaPipeTiming.next;

  for (const [index, timestampMs] of videoTimestampsMs.entries()) {
    await seekVideo(video, timestampMs);
    await waitForUsableVideoFrame(video);

    const result = poseLandmarker.detectForVideo(
      video,
      mediaPipeTiming.timestamps[index],
    );
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
export const __sampleTimestampsForTest = sampleTimestamps;
export const __mediaPipeTimestampsForTest = mediaPipeTimestampsFor;
export const __hasUsableVideoFrameForTest = hasUsableVideoFrame;
export const __createCachedPoseLandmarkerForTest = createCachedPoseLandmarker;
export const __POSE_ASSET_URLS_FOR_TEST = {
  wasm: WASM_ASSET_PATH,
  model: MODEL_ASSET_PATH,
};

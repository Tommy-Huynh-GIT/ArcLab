import type {
  PoseAnalysisInput,
  PoseFrame,
  PoseLandmarkName,
} from "@/features/pose/types";

export const MINIMUM_FRAMES = 4;
export const MINIMUM_VISIBILITY = 0.5;

export function validatePoseAnalysisInput(input: PoseAnalysisInput) {
  if (input.handedness !== "LEFT" && input.handedness !== "RIGHT") {
    throw new Error("Handedness must be LEFT or RIGHT.");
  }

  if (!Array.isArray(input.frames) || input.frames.length < MINIMUM_FRAMES) {
    throw new Error("At least four pose frames are required for scoring.");
  }

  let previousTimestamp = Number.NEGATIVE_INFINITY;

  input.frames.forEach((frame, frameIndex) => {
    if (
      !Number.isFinite(frame.timestampMs) ||
      frame.timestampMs <= previousTimestamp
    ) {
      throw new Error("Pose frame timestamps must be strictly increasing.");
    }

    previousTimestamp = frame.timestampMs;
    validateFrameLandmarks(frame, frameIndex);
  });
}

function validateFrameLandmarks(frame: PoseFrame, frameIndex: number) {
  const names = new Set<PoseLandmarkName>();

  for (const landmark of frame.landmarks) {
    if (names.has(landmark.name)) {
      throw new Error(`Duplicate landmark ${landmark.name} in frame ${frameIndex}.`);
    }

    names.add(landmark.name);

    if (
      !Number.isFinite(landmark.x) ||
      !Number.isFinite(landmark.y) ||
      !Number.isFinite(landmark.visibility)
    ) {
      throw new Error(`Invalid coordinate for ${landmark.name} in frame ${frameIndex}.`);
    }

    if (
      landmark.x < 0 ||
      landmark.x > 1 ||
      landmark.y < 0 ||
      landmark.y > 1
    ) {
      throw new Error(
        `Normalized coordinate out of range for ${landmark.name} in frame ${frameIndex}.`,
      );
    }
  }
}

import type {
  PoseAnalysisInput,
  PoseFrame,
  PoseLandmarkName,
} from "@/features/pose/types";

export const MINIMUM_FRAMES = 4;
export const MINIMUM_VISIBILITY = 0.5;

const LANDMARK_NAMES = new Set<PoseLandmarkName>([
  "left_shoulder",
  "right_shoulder",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
]);

export class PoseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PoseValidationError";
  }
}

function validationError(message: string): never {
  throw new PoseValidationError(message);
}

export function validatePoseAnalysisInput(input: PoseAnalysisInput) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    validationError("Pose payload must be an object.");
  }

  if (input.handedness !== "LEFT" && input.handedness !== "RIGHT") {
    validationError("Handedness must be LEFT or RIGHT.");
  }

  if (!Array.isArray(input.frames) || input.frames.length < MINIMUM_FRAMES) {
    validationError("At least four pose frames are required for scoring.");
  }

  let previousTimestamp = Number.NEGATIVE_INFINITY;

  input.frames.forEach((frame, frameIndex) => {
    if (!frame || typeof frame !== "object" || Array.isArray(frame)) {
      validationError(`Pose frame ${frameIndex} must be an object.`);
    }

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
  if (!Array.isArray(frame.landmarks)) {
    validationError(`Pose frame ${frameIndex} must include landmarks.`);
  }

  const names = new Set<PoseLandmarkName>();

  for (const landmark of frame.landmarks) {
    if (!landmark || typeof landmark !== "object" || Array.isArray(landmark)) {
      validationError(`Invalid landmark in frame ${frameIndex}.`);
    }

    if (!LANDMARK_NAMES.has(landmark.name)) {
      validationError(`Unknown landmark in frame ${frameIndex}.`);
    }

    if (names.has(landmark.name)) {
      validationError(`Duplicate landmark ${landmark.name} in frame ${frameIndex}.`);
    }

    names.add(landmark.name);

    if (
      !Number.isFinite(landmark.x) ||
      !Number.isFinite(landmark.y) ||
      !Number.isFinite(landmark.visibility)
    ) {
      validationError(`Invalid coordinate for ${landmark.name} in frame ${frameIndex}.`);
    }

    if (
      landmark.x < 0 ||
      landmark.x > 1 ||
      landmark.y < 0 ||
      landmark.y > 1
    ) {
      validationError(
        `Normalized coordinate out of range for ${landmark.name} in frame ${frameIndex}.`,
      );
    }
  }
}

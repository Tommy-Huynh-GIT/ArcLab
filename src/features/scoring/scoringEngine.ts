import type {
  NormalizedLandmark,
  PoseAnalysisInput,
  PoseFrame,
  PoseLandmarkName,
} from "@/features/pose/types";
import { feedbackForMetric } from "./feedback";
import {
  average,
  clampScore,
  ensureFiniteMetric,
  horizontalDistance,
  scoreFromError,
} from "./geometry";
import type { CoachingReport, KeyFrame, MetricName, MetricScore, Rank } from "./types";
import {
  MINIMUM_VISIBILITY,
  PoseValidationError,
  validatePoseAnalysisInput,
} from "./validation";

function rankFor(score: number): Rank {
  if (score >= 90) {
    return "S";
  }

  if (score >= 80) {
    return "A";
  }

  if (score >= 70) {
    return "B";
  }

  if (score >= 60) {
    return "C";
  }

  return "D";
}

function visibleLandmark(
  frame: PoseFrame,
  name: PoseLandmarkName,
): NormalizedLandmark {
  const landmark = frame.landmarks.find((item) => item.name === name);

  if (!landmark || landmark.visibility < MINIMUM_VISIBILITY) {
    throw new PoseValidationError(`Missing visible landmark: ${name}`);
  }

  return landmark;
}

function makeMetric(
  name: MetricName,
  label: string,
  score: number,
  value: number,
): MetricScore {
  const clampedScore = clampScore(score);
  const roundedValue = Number(value.toFixed(3));
  ensureFiniteMetric(clampedScore, name);
  ensureFiniteMetric(roundedValue, name);
  const feedback = feedbackForMetric({
    name,
    score: clampedScore,
    value: roundedValue,
  });

  return {
    name,
    label,
    score: clampedScore,
    value: roundedValue,
    feedback: feedback.feedback,
    drill: feedback.drill,
  };
}

function shootingSide(input: PoseAnalysisInput) {
  return input.handedness === "RIGHT" ? "right" : "left";
}

function oppositeSide(input: PoseAnalysisInput) {
  return input.handedness === "RIGHT" ? "left" : "right";
}

function keyFramesFor(frames: PoseFrame[]) {
  const setup = frames[0];
  const dip = frames[Math.min(frames.length - 2, Math.floor(frames.length / 3))];
  const release =
    frames[Math.min(frames.length - 2, Math.floor((frames.length / 3) * 2))];
  const followThrough = frames[frames.length - 1];

  return { setup, dip, release, followThrough };
}

export function scoreFreeThrow(input: PoseAnalysisInput): CoachingReport {
  validatePoseAnalysisInput(input);

  const { setup, dip, release, followThrough } = keyFramesFor(input.frames);
  const shooterSide = shootingSide(input);
  const guideSide = oppositeSide(input);

  const leftAnkle = visibleLandmark(setup, "left_ankle");
  const rightAnkle = visibleLandmark(setup, "right_ankle");
  const leftShoulder = visibleLandmark(setup, "left_shoulder");
  const rightShoulder = visibleLandmark(setup, "right_shoulder");
  const leftKnee = visibleLandmark(dip, "left_knee");
  const rightKnee = visibleLandmark(dip, "right_knee");
  const shootingShoulder = visibleLandmark(
    release,
    `${shooterSide}_shoulder` as PoseLandmarkName,
  );
  const shootingElbow = visibleLandmark(
    release,
    `${shooterSide}_elbow` as PoseLandmarkName,
  );
  const shootingWrist = visibleLandmark(
    release,
    `${shooterSide}_wrist` as PoseLandmarkName,
  );
  const guideWrist = visibleLandmark(
    release,
    `${guideSide}_wrist` as PoseLandmarkName,
  );
  const finishWrist = visibleLandmark(
    followThrough,
    `${shooterSide}_wrist` as PoseLandmarkName,
  );

  const shoulderWidth = horizontalDistance(rightShoulder, leftShoulder);
  if (shoulderWidth < 0.05) {
    throw new PoseValidationError("Shoulder width is too small to score stance reliably.");
  }

  const stanceWidth = horizontalDistance(rightAnkle, leftAnkle);
  const stanceRatio = stanceWidth / shoulderWidth;
  const stanceScore = scoreFromError(Math.abs(stanceRatio - 1.25), 0.35);

  const leftKneeOffset = horizontalDistance(leftKnee, leftAnkle);
  const rightKneeOffset = horizontalDistance(rightKnee, rightAnkle);
  const kneeOffset = average([leftKneeOffset, rightKneeOffset]);
  const kneeScore = scoreFromError(kneeOffset, 0.08);

  const elbowOffset = horizontalDistance(shootingElbow, shootingShoulder);
  const guideDistance = horizontalDistance(guideWrist, shootingWrist);
  const elbowScore =
    scoreFromError(elbowOffset, 0.12) * 0.8 +
    scoreFromError(Math.max(0, guideDistance - 0.18), 0.16) * 0.2;

  const armExtension = Math.max(0, shootingElbow.y - shootingWrist.y);
  const armExtensionScore = scoreFromError(Math.abs(armExtension - 0.16), 0.12);

  const followThroughHold = Math.max(0, shootingElbow.y - finishWrist.y);
  const followThroughScore = scoreFromError(
    Math.abs(followThroughHold - armExtension),
    0.1,
  );

  const metrics: MetricScore[] = [
    makeMetric(
      "stanceWidth",
      "Stance width",
      stanceScore,
      stanceRatio,
    ),
    makeMetric(
      "kneeAlignment",
      "Knee alignment",
      kneeScore,
      kneeOffset,
    ),
    makeMetric(
      "elbowAlignment",
      "Elbow alignment",
      elbowScore,
      elbowOffset,
    ),
    makeMetric(
      "armExtension",
      "Arm extension",
      armExtensionScore,
      armExtension,
    ),
    makeMetric(
      "followThrough",
      "Follow-through",
      followThroughScore,
      followThroughHold,
    ),
  ];

  const overallScore = clampScore(
    metrics.reduce((total, metric) => total + metric.score, 0) / metrics.length,
  );
  const rank = rankFor(overallScore);
  const keyFrames: KeyFrame[] = [
    { label: "setup", timestampMs: setup.timestampMs },
    { label: "dip", timestampMs: dip.timestampMs },
    { label: "release", timestampMs: release.timestampMs },
    { label: "followThrough", timestampMs: followThrough.timestampMs },
  ];

  return {
    overallScore,
    rank,
    summary: `ArcLab scored five front-facing free throw mechanics for this ${input.handedness.toLowerCase()}-handed shot and gave it a ${rank}.`,
    metrics,
    keyFrames,
  };
}

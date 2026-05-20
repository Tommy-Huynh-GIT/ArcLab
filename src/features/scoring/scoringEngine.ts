import type {
  NormalizedLandmark,
  PoseAnalysisInput,
  PoseFrame,
  PoseLandmarkName,
} from "@/features/pose/types";
import type { CoachingReport, KeyFrame, MetricScore, Rank } from "./types";

const MINIMUM_FRAMES = 4;
const MINIMUM_VISIBILITY = 0.5;

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function clampScore(score: number) {
  return Math.round(clamp(score));
}

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
    throw new Error(`Missing visible landmark: ${name}`);
  }

  return landmark;
}

function scoreFromError(error: number, tolerance: number) {
  return clampScore(100 - (error / tolerance) * 100);
}

function makeMetric(
  name: MetricScore["name"],
  label: string,
  score: number,
  value: number,
  feedback: string,
  drill: string,
): MetricScore {
  return {
    name,
    label,
    score: clampScore(score),
    value: Number(value.toFixed(3)),
    feedback,
    drill,
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
  if (input.frames.length < MINIMUM_FRAMES) {
    throw new Error("At least four pose frames are required for scoring.");
  }

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

  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const stanceWidth = Math.abs(rightAnkle.x - leftAnkle.x);
  const stanceRatio = stanceWidth / shoulderWidth;
  const stanceScore = scoreFromError(Math.abs(stanceRatio - 1.25), 0.35);

  const ankleCenter = (leftAnkle.x + rightAnkle.x) / 2;
  const kneeCenter = (leftKnee.x + rightKnee.x) / 2;
  const kneeOffset = Math.abs(kneeCenter - ankleCenter);
  const kneeScore = scoreFromError(kneeOffset, 0.08);

  const elbowOffset = Math.abs(shootingElbow.x - shootingShoulder.x);
  const guideDistance = Math.abs(guideWrist.x - shootingWrist.x);
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
      "Your feet are close to shoulder-plus width, which gives the shot a steady base.",
      "Mark shoulder width on the floor and start each rep just outside those marks.",
    ),
    makeMetric(
      "kneeAlignment",
      "Knee alignment",
      kneeScore,
      kneeOffset,
      "Your knees stay centered over the stance through the dip.",
      "Pause for one count at the dip and check that both knees track over the feet.",
    ),
    makeMetric(
      "elbowAlignment",
      "Elbow alignment",
      elbowScore,
      elbowOffset,
      "Your shooting elbow stays near the shooting-side shoulder line.",
      "Take close one-hand form shots and keep the elbow under the ball.",
    ),
    makeMetric(
      "armExtension",
      "Arm extension",
      armExtensionScore,
      armExtension,
      "Your release has a clear upward reach without forcing the arm past its line.",
      "Hold the release until the ball reaches the rim, then reset calmly.",
    ),
    makeMetric(
      "followThrough",
      "Follow-through",
      followThroughScore,
      followThroughHold,
      "Your shooting wrist remains high after release, which suggests a repeatable finish.",
      "Make 20 free throws while holding the finish for two seconds.",
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

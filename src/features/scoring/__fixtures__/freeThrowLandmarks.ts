import type { PoseAnalysisInput, PoseFrame } from "@/features/pose/types";

const setupLandmarks: PoseFrame["landmarks"] = [
  { name: "left_shoulder", x: 0.42, y: 0.22, visibility: 0.98 },
  { name: "right_shoulder", x: 0.58, y: 0.22, visibility: 0.98 },
  { name: "left_elbow", x: 0.43, y: 0.38, visibility: 0.96 },
  { name: "right_elbow", x: 0.56, y: 0.34, visibility: 0.96 },
  { name: "left_wrist", x: 0.44, y: 0.53, visibility: 0.95 },
  { name: "right_wrist", x: 0.55, y: 0.28, visibility: 0.95 },
  { name: "left_hip", x: 0.44, y: 0.5, visibility: 0.97 },
  { name: "right_hip", x: 0.56, y: 0.5, visibility: 0.97 },
  { name: "left_knee", x: 0.43, y: 0.7, visibility: 0.97 },
  { name: "right_knee", x: 0.57, y: 0.7, visibility: 0.97 },
  { name: "left_ankle", x: 0.4, y: 0.92, visibility: 0.97 },
  { name: "right_ankle", x: 0.6, y: 0.92, visibility: 0.97 },
];

const dipLandmarks: PoseFrame["landmarks"] = [
  { name: "left_shoulder", x: 0.42, y: 0.27, visibility: 0.98 },
  { name: "right_shoulder", x: 0.58, y: 0.27, visibility: 0.98 },
  { name: "left_elbow", x: 0.43, y: 0.42, visibility: 0.96 },
  { name: "right_elbow", x: 0.55, y: 0.41, visibility: 0.96 },
  { name: "left_wrist", x: 0.44, y: 0.56, visibility: 0.95 },
  { name: "right_wrist", x: 0.54, y: 0.35, visibility: 0.95 },
  { name: "left_hip", x: 0.44, y: 0.55, visibility: 0.97 },
  { name: "right_hip", x: 0.56, y: 0.55, visibility: 0.97 },
  { name: "left_knee", x: 0.42, y: 0.73, visibility: 0.97 },
  { name: "right_knee", x: 0.58, y: 0.73, visibility: 0.97 },
  { name: "left_ankle", x: 0.4, y: 0.92, visibility: 0.97 },
  { name: "right_ankle", x: 0.6, y: 0.92, visibility: 0.97 },
];

const releaseLandmarks: PoseFrame["landmarks"] = [
  { name: "left_shoulder", x: 0.42, y: 0.2, visibility: 0.98 },
  { name: "right_shoulder", x: 0.58, y: 0.2, visibility: 0.98 },
  { name: "left_elbow", x: 0.43, y: 0.34, visibility: 0.96 },
  { name: "right_elbow", x: 0.54, y: 0.24, visibility: 0.96 },
  { name: "left_wrist", x: 0.44, y: 0.48, visibility: 0.95 },
  { name: "right_wrist", x: 0.53, y: 0.08, visibility: 0.95 },
  { name: "left_hip", x: 0.44, y: 0.49, visibility: 0.97 },
  { name: "right_hip", x: 0.56, y: 0.49, visibility: 0.97 },
  { name: "left_knee", x: 0.43, y: 0.68, visibility: 0.97 },
  { name: "right_knee", x: 0.57, y: 0.68, visibility: 0.97 },
  { name: "left_ankle", x: 0.4, y: 0.92, visibility: 0.97 },
  { name: "right_ankle", x: 0.6, y: 0.92, visibility: 0.97 },
];

const followThroughLandmarks: PoseFrame["landmarks"] = [
  { name: "left_shoulder", x: 0.42, y: 0.21, visibility: 0.98 },
  { name: "right_shoulder", x: 0.58, y: 0.21, visibility: 0.98 },
  { name: "left_elbow", x: 0.43, y: 0.35, visibility: 0.96 },
  { name: "right_elbow", x: 0.54, y: 0.25, visibility: 0.96 },
  { name: "left_wrist", x: 0.44, y: 0.49, visibility: 0.95 },
  { name: "right_wrist", x: 0.52, y: 0.09, visibility: 0.95 },
  { name: "left_hip", x: 0.44, y: 0.5, visibility: 0.97 },
  { name: "right_hip", x: 0.56, y: 0.5, visibility: 0.97 },
  { name: "left_knee", x: 0.43, y: 0.69, visibility: 0.97 },
  { name: "right_knee", x: 0.57, y: 0.69, visibility: 0.97 },
  { name: "left_ankle", x: 0.4, y: 0.92, visibility: 0.97 },
  { name: "right_ankle", x: 0.6, y: 0.92, visibility: 0.97 },
];

export const balancedFreeThrow: PoseAnalysisInput = {
  handedness: "RIGHT",
  frames: [
    { timestampMs: 0, landmarks: setupLandmarks },
    { timestampMs: 350, landmarks: dipLandmarks },
    { timestampMs: 700, landmarks: releaseLandmarks },
    { timestampMs: 1050, landmarks: followThroughLandmarks },
  ],
};

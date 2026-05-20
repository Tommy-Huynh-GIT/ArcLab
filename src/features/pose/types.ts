export type Handedness = "LEFT" | "RIGHT";

export type PoseLandmarkName =
  | "left_shoulder"
  | "right_shoulder"
  | "left_elbow"
  | "right_elbow"
  | "left_wrist"
  | "right_wrist"
  | "left_hip"
  | "right_hip"
  | "left_knee"
  | "right_knee"
  | "left_ankle"
  | "right_ankle";

export type NormalizedLandmark = {
  name: PoseLandmarkName;
  x: number;
  y: number;
  visibility: number;
};

export type PoseFrame = {
  timestampMs: number;
  landmarks: NormalizedLandmark[];
};

export type PoseAnalysisInput = {
  handedness: Handedness;
  frames: PoseFrame[];
};

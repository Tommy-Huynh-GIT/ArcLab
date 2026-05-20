export type MetricName =
  | "stanceWidth"
  | "kneeAlignment"
  | "elbowAlignment"
  | "armExtension"
  | "followThrough";

export type Rank = "D" | "C" | "B" | "A" | "S";

export type MetricScore = {
  name: MetricName;
  label: string;
  score: number;
  value: number;
  feedback: string;
  drill: string;
};

export type KeyFrame = {
  label: "setup" | "dip" | "release" | "followThrough";
  timestampMs: number;
};

export type CoachingReport = {
  overallScore: number;
  rank: Rank;
  summary: string;
  metrics: MetricScore[];
  keyFrames: KeyFrame[];
};

import type { NormalizedLandmark } from "@/features/pose/types";

export type Point = Pick<NormalizedLandmark, "x" | "y">;

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function clampScore(score: number) {
  return Math.round(clamp(score));
}

export function horizontalDistance(first: Point, second: Point) {
  return Math.abs(first.x - second.x);
}

export function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function scoreFromError(error: number, tolerance: number) {
  return clampScore(100 - (error / tolerance) * 100);
}

export function ensureFiniteMetric(value: number, metricName: string) {
  if (!Number.isFinite(value)) {
    throw new Error(`Unable to compute finite value for ${metricName}.`);
  }
}

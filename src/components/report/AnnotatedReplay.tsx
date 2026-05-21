"use client";

import { useCallback, useEffect, useRef } from "react";
import type {
  NormalizedLandmark,
  PoseFrame,
  PoseLandmarkName,
} from "@/features/pose/types";

type Props = {
  videoUrl: string;
  frames: PoseFrame[];
  keyframeTimestamps?: number[];
};

const guideSegments = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_hip", "right_hip"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
] satisfies Array<[PoseLandmarkName, PoseLandmarkName]>;

export function getNearestPoseFrame(
  frames: PoseFrame[],
  currentTimeSeconds: number,
) {
  if (frames.length === 0) {
    return null;
  }

  const currentTimestampMs = currentTimeSeconds * 1000;

  return frames.reduce((nearest, frame) => {
    const nearestDistance = Math.abs(nearest.timestampMs - currentTimestampMs);
    const frameDistance = Math.abs(frame.timestampMs - currentTimestampMs);

    return frameDistance < nearestDistance ? frame : nearest;
  });
}

function landmarksByName(landmarks: NormalizedLandmark[]) {
  return new Map(landmarks.map((landmark) => [landmark.name, landmark]));
}

function getCanvasSize(video: HTMLVideoElement) {
  return {
    width: Math.round(video.clientWidth || video.videoWidth || 640),
    height: Math.round(video.clientHeight || video.videoHeight || 360),
  };
}

function pointForLandmark(
  landmark: NormalizedLandmark,
  width: number,
  height: number,
) {
  return {
    x: landmark.x * width,
    y: landmark.y * height,
  };
}

export function AnnotatedReplay({
  videoUrl,
  frames,
  keyframeTimestamps = [],
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawOverlay = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!video || !canvas || !context) {
      return;
    }

    const { width, height } = getCanvasSize(video);
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);

    const frame = getNearestPoseFrame(frames, video.currentTime);

    if (!frame) {
      return;
    }

    const landmarks = landmarksByName(frame.landmarks);
    context.lineCap = "round";
    context.lineWidth = 3;
    context.strokeStyle = "rgba(50, 211, 255, 0.88)";
    context.fillStyle = "rgba(255, 47, 79, 0.96)";

    for (const [startName, endName] of guideSegments) {
      const start = landmarks.get(startName);
      const end = landmarks.get(endName);

      if (!start || !end) {
        continue;
      }

      const startPoint = pointForLandmark(start, width, height);
      const endPoint = pointForLandmark(end, width, height);
      context.beginPath();
      context.moveTo(startPoint.x, startPoint.y);
      context.lineTo(endPoint.x, endPoint.y);
      context.stroke();
    }

    for (const landmark of frame.landmarks) {
      const point = pointForLandmark(landmark, width, height);
      context.beginPath();
      context.arc(point.x, point.y, 5, 0, Math.PI * 2);
      context.fill();
    }
  }, [frames]);

  useEffect(() => {
    drawOverlay();
  }, [drawOverlay, videoUrl]);

  useEffect(() => {
    window.addEventListener("resize", drawOverlay);

    return () => {
      window.removeEventListener("resize", drawOverlay);
    };
  }, [drawOverlay]);

  return (
    <section className="panel annotated-replay" aria-labelledby="replay-heading">
      <div className="panel-heading">
        <p className="eyebrow">Annotated replay</p>
        <h2 id="replay-heading">Current clip overlay</h2>
      </div>

      <div className="replay-stage">
        <video
          aria-label="Annotated replay video"
          className="replay-video"
          controls
          onLoadedMetadata={drawOverlay}
          onSeeked={drawOverlay}
          onTimeUpdate={drawOverlay}
          ref={videoRef}
          src={videoUrl}
        />
        <canvas
          aria-label="Pose landmark overlay"
          className="replay-overlay"
          ref={canvasRef}
        />
      </div>

      {frames.length === 0 ? (
        <p className="replay-empty">Pose overlay is unavailable for this clip.</p>
      ) : null}

      {keyframeTimestamps.length > 0 ? (
        <div className="replay-keyframes" aria-label="Replay keyframes">
          {keyframeTimestamps.map((timestampMs) => (
            <span key={timestampMs}>
              {Number((timestampMs / 1000).toFixed(2))}s
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

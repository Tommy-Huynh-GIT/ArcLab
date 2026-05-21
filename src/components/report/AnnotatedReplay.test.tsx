import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { balancedFreeThrow } from "@/features/scoring/__fixtures__/freeThrowLandmarks";
import {
  AnnotatedReplay,
  getNearestPoseFrame,
  getRenderedVideoRect,
} from "./AnnotatedReplay";

describe("getNearestPoseFrame", () => {
  it("returns null when no frames are available", () => {
    expect(getNearestPoseFrame([], 0.4)).toBeNull();
  });

  it("chooses the pose frame nearest to the current video time", () => {
    const frames = balancedFreeThrow.frames;

    expect(getNearestPoseFrame(frames, 0.52)).toBe(frames[1]);
    expect(getNearestPoseFrame(frames, 0.91)).toBe(frames[3]);
  });
});

describe("getRenderedVideoRect", () => {
  it("returns the full canvas when intrinsic video dimensions are unavailable", () => {
    expect(getRenderedVideoRect(640, 360, 0, 0)).toEqual({
      height: 360,
      offsetX: 0,
      offsetY: 0,
      width: 640,
    });
  });

  it("centers portrait video content inside a landscape stage", () => {
    expect(getRenderedVideoRect(640, 360, 720, 1280)).toEqual({
      height: 360,
      offsetX: 218.75,
      offsetY: 0,
      width: 202.5,
    });
  });
});

describe("AnnotatedReplay", () => {
  let calls: string[];

  beforeEach(() => {
    calls = [];

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      beginPath: vi.fn(() => calls.push("beginPath")),
      arc: vi.fn((x: number, y: number) => calls.push(`arc:${x}:${y}`)),
      clearRect: vi.fn(() => calls.push("clearRect")),
      lineTo: vi.fn((x: number, y: number) => calls.push(`lineTo:${x}:${y}`)),
      moveTo: vi.fn((x: number, y: number) => calls.push(`moveTo:${x}:${y}`)),
      stroke: vi.fn(() => calls.push("stroke")),
      fill: vi.fn(() => calls.push("fill")),
      set fillStyle(value: string) {
        calls.push(`fillStyle:${value}`);
      },
      set lineCap(value: CanvasLineCap) {
        calls.push(`lineCap:${value}`);
      },
      set lineWidth(value: number) {
        calls.push(`lineWidth:${value}`);
      },
      set strokeStyle(value: string) {
        calls.push(`strokeStyle:${value}`);
      },
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a graceful state when no pose frames exist", () => {
    render(<AnnotatedReplay frames={[]} videoUrl="blob:free-throw" />);

    expect(
      screen.getByText("Pose overlay is unavailable for this clip."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/annotated replay video/i)).toBeInTheDocument();
  });

  it("draws the nearest frame when video time updates", () => {
    render(
      <AnnotatedReplay
        frames={balancedFreeThrow.frames}
        keyframeTimestamps={[700]}
        videoUrl="blob:free-throw"
      />,
    );

    const video = screen.getByLabelText(/annotated replay video/i);
    const canvas = screen.getByLabelText(/pose landmark overlay/i);

    Object.defineProperty(video, "clientWidth", {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(video, "clientHeight", {
      configurable: true,
      value: 360,
    });
    Object.defineProperty(video, "currentTime", {
      configurable: true,
      value: 0.7,
    });

    fireEvent.loadedMetadata(video);
    fireEvent.timeUpdate(video);

    expect(canvas).toHaveAttribute("width", "640");
    expect(canvas).toHaveAttribute("height", "360");
    expect(calls).toContain("clearRect");
    expect(calls).toContain("moveTo:268.8:72");
    expect(calls).toContain("lineTo:371.2:72");
    expect(
      calls.some((call) => /^arc:339\.\d+:28\.\d+/.test(call)),
    ).toBe(true);
  });

  it("draws landmarks inside the rendered video area for portrait clips", () => {
    render(
      <AnnotatedReplay
        frames={balancedFreeThrow.frames}
        videoUrl="blob:portrait-free-throw"
      />,
    );

    const video = screen.getByLabelText(/annotated replay video/i);

    Object.defineProperty(video, "clientWidth", {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(video, "clientHeight", {
      configurable: true,
      value: 360,
    });
    Object.defineProperty(video, "videoWidth", {
      configurable: true,
      value: 720,
    });
    Object.defineProperty(video, "videoHeight", {
      configurable: true,
      value: 1280,
    });
    Object.defineProperty(video, "currentTime", {
      configurable: true,
      value: 0,
    });

    fireEvent.loadedMetadata(video);

    expect(calls).toContain("moveTo:303.8:79.2");
    expect(calls).toContain("lineTo:336.2:79.2");
  });
});

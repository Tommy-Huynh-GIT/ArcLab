import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VideoUploadPanel } from "./VideoUploadPanel";

describe("VideoUploadPanel", () => {
  const objectUrl = "blob:free-throw-preview";
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => objectUrl);
    revokeObjectURL = vi.fn();

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("disables analyze until a video file is selected", () => {
    render(<VideoUploadPanel onAnalyze={vi.fn()} />);

    expect(screen.getByRole("button", { name: /analyze/i })).toBeDisabled();
  });

  it("shows the selected filename and video preview after choosing a file", () => {
    const file = new File(["video"], "maya-free-throw.webm", {
      type: "video/webm",
    });

    render(<VideoUploadPanel onAnalyze={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/free throw clip/i), {
      target: { files: [file] },
    });

    expect(screen.getByText("maya-free-throw.webm")).toBeInTheDocument();
    expect(screen.getByLabelText(/selected free throw preview/i)).toHaveAttribute(
      "src",
      objectUrl,
    );
  });

  it("calls onAnalyze with the selected video file and preview element", async () => {
    const onAnalyze = vi.fn();
    const file = new File(["video"], "front-view.mp4", { type: "video/mp4" });

    render(<VideoUploadPanel onAnalyze={onAnalyze} />);
    fireEvent.change(screen.getByLabelText(/free throw clip/i), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));

    await waitFor(() =>
      expect(onAnalyze).toHaveBeenCalledWith(file, expect.any(HTMLVideoElement)),
    );
  });

  it("shows async analysis state while onAnalyze is running", async () => {
    let finishAnalysis: () => void = () => {};
    const onAnalyze = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishAnalysis = resolve;
        }),
    );
    const file = new File(["video"], "front-view.mp4", { type: "video/mp4" });

    render(<VideoUploadPanel onAnalyze={onAnalyze} />);
    fireEvent.change(screen.getByLabelText(/free throw clip/i), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));

    expect(screen.getByRole("button", { name: /analyzing/i })).toBeDisabled();
    expect(screen.getByLabelText(/free throw clip/i)).toBeDisabled();

    finishAnalysis();

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /analyze/i })).toBeEnabled(),
    );
  });

  it("shows an analysis error when onAnalyze fails", async () => {
    const onAnalyze = vi.fn().mockRejectedValue(new Error("Pose extraction failed."));
    const file = new File(["video"], "front-view.mp4", { type: "video/mp4" });

    render(<VideoUploadPanel onAnalyze={onAnalyze} />);
    fireEvent.change(screen.getByLabelText(/free throw clip/i), {
      target: { files: [file] },
    });
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));

    expect(await screen.findByText("Pose extraction failed.")).toBeInTheDocument();
  });

  it("cleans up object URLs when the selected file changes and on unmount", () => {
    createObjectURL
      .mockReturnValueOnce("blob:first-preview")
      .mockReturnValueOnce("blob:second-preview");
    const firstFile = new File(["first"], "first.mov", {
      type: "video/quicktime",
    });
    const secondFile = new File(["second"], "second.mp4", {
      type: "video/mp4",
    });

    const { unmount } = render(<VideoUploadPanel onAnalyze={vi.fn()} />);
    const input = screen.getByLabelText(/free throw clip/i);

    fireEvent.change(input, { target: { files: [firstFile] } });
    fireEvent.change(input, { target: { files: [secondFile] } });

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:first-preview");

    unmount();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:second-preview");
  });
});

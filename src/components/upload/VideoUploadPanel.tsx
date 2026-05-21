"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onAnalyze: (file: File, video: HTMLVideoElement) => Promise<void> | void;
  onFileSelected?: () => void;
};

const acceptedVideoTypes = "video/mp4,video/quicktime,video/webm";

export function VideoUploadPanel({ onAnalyze, onFileSelected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  useEffect(() => {
    if (!selectedVideo) return;

    return () => {
      URL.revokeObjectURL(selectedVideo.previewUrl);
    };
  }, [selectedVideo]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    onFileSelected?.();
    setAnalysisError("");
    setSelectedVideo(
      file ? { file, previewUrl: URL.createObjectURL(file) } : null,
    );
  }

  async function handleAnalyze() {
    if (!selectedVideo || isAnalyzing) {
      return;
    }

    if (!videoRef.current) {
      setAnalysisError("Video preview is not ready yet.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError("");

    try {
      await onAnalyze(selectedVideo.file, videoRef.current);
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Unable to analyze this video.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <section className="panel upload-panel">
      <div className="panel-heading">
        <p className="eyebrow">Free throw clip</p>
        <h2>Upload front-facing video</h2>
      </div>

      <p className="muted">
        Choose a front-facing free throw clip from practice. ArcLab will use
        this clip for analysis in the next step.
      </p>

      <label className="video-file-picker">
        <span>Free throw clip</span>
        <input
          accept={acceptedVideoTypes}
          disabled={isAnalyzing}
          onChange={handleFileChange}
          type="file"
        />
      </label>

      {selectedVideo ? (
        <div className="selected-file" aria-live="polite">
          <span>Selected file</span>
          <strong>{selectedVideo.file.name}</strong>
        </div>
      ) : (
        <p className="upload-empty">MP4, MOV, or WebM video accepted.</p>
      )}

      {selectedVideo ? (
        <video
          aria-label="Selected free throw preview"
          className="video-preview"
          controls
          ref={videoRef}
          src={selectedVideo.previewUrl}
        />
      ) : null}

      {analysisError ? (
        <p className="upload-error" role="alert">
          {analysisError}
        </p>
      ) : null}

      <button
        disabled={!selectedVideo || isAnalyzing}
        onClick={handleAnalyze}
        type="button"
      >
        {isAnalyzing ? "Analyzing..." : "Analyze"}
      </button>
    </section>
  );
}

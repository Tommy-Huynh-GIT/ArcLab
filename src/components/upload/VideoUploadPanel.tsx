"use client";

import { useEffect, useState } from "react";

type Props = {
  onAnalyze: (file: File) => void;
};

const acceptedVideoTypes = "video/mp4,video/quicktime,video/webm";

export function VideoUploadPanel({ onAnalyze }: Props) {
  const [selectedVideo, setSelectedVideo] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);

  useEffect(() => {
    if (!selectedVideo) return;

    return () => {
      URL.revokeObjectURL(selectedVideo.previewUrl);
    };
  }, [selectedVideo]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setSelectedVideo(
      file ? { file, previewUrl: URL.createObjectURL(file) } : null,
    );
  }

  function handleAnalyze() {
    if (selectedVideo) {
      onAnalyze(selectedVideo.file);
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
          src={selectedVideo.previewUrl}
        />
      ) : null}

      <button disabled={!selectedVideo} onClick={handleAnalyze} type="button">
        Analyze
      </button>
    </section>
  );
}

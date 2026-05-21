"use client";

import { useState } from "react";
import {
  ProfilePicker,
  type Profile,
} from "@/components/profile/ProfilePicker";
import {
  AnnotatedReplay,
} from "@/components/report/AnnotatedReplay";
import {
  ReportSummary,
  type SavedSessionReport,
} from "@/components/report/ReportSummary";
import { SessionHistory } from "@/components/report/SessionHistory";
import { VideoUploadPanel } from "@/components/upload/VideoUploadPanel";
import { extractPoseLandmarks } from "@/features/pose/extractPoseLandmarks";
import type { PoseFrame } from "@/features/pose/types";

type CurrentReplay = {
  sessionId: string;
  videoUrl: string;
  frames: PoseFrame[];
};

function readApiError(data: unknown, fallback: string) {
  return data &&
    typeof data === "object" &&
    "error" in data &&
    typeof data.error === "string"
    ? data.error
    : fallback;
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isSavedSession(value: unknown): value is SavedSessionReport {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Record<string, unknown>;

  return (
    typeof session.id === "string" &&
    typeof session.title === "string" &&
    !!session.report &&
    typeof session.report === "object"
  );
}

export default function Home() {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [savedSession, setSavedSession] = useState<SavedSessionReport | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [analysisError, setAnalysisError] = useState("");
  const [currentReplay, setCurrentReplay] = useState<CurrentReplay | null>(null);

  function handleSelectProfile(profile: Profile) {
    setSelectedProfile(profile);
    setSavedSession(null);
    setCurrentReplay(null);
    setAnalysisStatus("");
    setAnalysisError("");
  }

  function handleSelectSession(session: SavedSessionReport) {
    setSavedSession(session);
    setCurrentReplay(null);
    setAnalysisStatus("");
    setAnalysisError("");
  }

  async function saveAnalyzedSession(file: File, video: HTMLVideoElement) {
    if (!selectedProfile) {
      const message = "Choose a profile before analyzing a clip.";
      setAnalysisStatus("");
      setAnalysisError(message);
      throw new Error(message);
    }

    setSavedSession(null);
    setCurrentReplay(null);
    setAnalysisError("");
    setAnalysisStatus("Extracting pose landmarks...");

    try {
      const pose = await extractPoseLandmarks(video, {
        handedness: selectedProfile.handedness,
      });

      setAnalysisStatus("Saving coaching report...");

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          title: file.name,
          pose,
        }),
      });
      const data = await readJson(response);

      if (!response.ok) {
        throw new Error(readApiError(data, "Unable to save analyzed session."));
      }

      if (!data || typeof data !== "object" || !("session" in data)) {
        throw new Error("Unable to read saved session.");
      }

      if (!isSavedSession(data.session)) {
        throw new Error("Saved session response was malformed.");
      }

      setSavedSession(data.session);
      setCurrentReplay({
        sessionId: data.session.id,
        videoUrl: video.currentSrc || video.src,
        frames: pose.frames,
      });
      setHistoryRefreshKey((currentKey) => currentKey + 1);
      setAnalysisStatus("Report saved.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to analyze this video.";
      setAnalysisStatus("");
      setAnalysisError(message);
      throw new Error(message);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">ArcLab MVP</p>
        <h1>Free throw form analysis with explainable coaching reports.</h1>
        <p className="hero-copy">
          Prepare front-facing free throw clips for ArcLab. Upload a clip to
          extract pose landmarks, score the mechanics, and save a coaching
          report.
        </p>
      </section>

      <section className="dashboard-grid" aria-label="ArcLab demo dashboard">
        <ProfilePicker onSelect={handleSelectProfile} />

        <section className="panel selected-profile-panel">
          <div className="panel-heading">
            <p className="eyebrow">Next step</p>
            <h2>
              {selectedProfile
                ? `${selectedProfile.name}'s upload queue`
                : "Select a profile"}
            </h2>
          </div>
          <p className="muted">
            {selectedProfile
              ? "Upload a front-facing free throw clip to generate a saved coaching report."
              : "Choose or create a demo player before uploading a free throw clip."}
          </p>
          {selectedProfile ? (
            <div className="selected-profile">
              <span>Active profile</span>
              <strong>{selectedProfile.name}</strong>
              <small>
                {selectedProfile.handedness === "LEFT"
                  ? "Left handed"
                  : "Right handed"}
              </small>
            </div>
          ) : null}

          {analysisStatus ? (
            <div className="analysis-status-panel" aria-live="polite">
              <span>Status</span>
              <strong>{analysisStatus}</strong>
            </div>
          ) : null}

          {analysisError ? (
            <p className="analysis-error" role="alert">
              {analysisError}
            </p>
          ) : null}
        </section>

        {selectedProfile ? (
          <VideoUploadPanel
            key={selectedProfile.id}
            onAnalyze={saveAnalyzedSession}
          />
        ) : null}

        {selectedProfile ? (
          <SessionHistory
            profileId={selectedProfile.id}
            refreshKey={historyRefreshKey}
            onSelectSession={handleSelectSession}
          />
        ) : null}

        {savedSession && currentReplay?.sessionId === savedSession.id ? (
          <AnnotatedReplay
            frames={currentReplay.frames}
            keyframeTimestamps={savedSession.report?.keyFrames.map(
              (keyFrame) => keyFrame.timestampMs,
            )}
            videoUrl={currentReplay.videoUrl}
          />
        ) : null}

        {savedSession ? <ReportSummary session={savedSession} /> : null}
      </section>
    </main>
  );
}

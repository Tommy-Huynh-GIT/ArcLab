"use client";

import { useState } from "react";
import {
  ProfilePicker,
  type Profile,
} from "@/components/profile/ProfilePicker";
import {
  ReportSummary,
  type SavedSessionReport,
} from "@/components/report/ReportSummary";
import { VideoUploadPanel } from "@/components/upload/VideoUploadPanel";
import { extractPoseLandmarks } from "@/features/pose/extractPoseLandmarks";

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
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [analysisError, setAnalysisError] = useState("");

  function handleSelectProfile(profile: Profile) {
    setSelectedProfile(profile);
    setSavedSession(null);
    setAnalysisStatus("");
    setAnalysisError("");
  }

  async function saveAnalyzedSession(file: File, video: HTMLVideoElement) {
    if (!selectedProfile) {
      throw new Error("Choose a profile before analyzing a clip.");
    }

    setSavedSession(null);
    setAnalysisError("");
    setAnalysisStatus("Extracting pose landmarks...");

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
      const message = readApiError(data, "Unable to save analyzed session.");
      setAnalysisError(message);
      throw new Error(message);
    }

    if (!data || typeof data !== "object" || !("session" in data)) {
      const message = "Unable to read saved session.";
      setAnalysisError(message);
      throw new Error(message);
    }

    if (!isSavedSession(data.session)) {
      const message = "Saved session response was malformed.";
      setAnalysisError(message);
      throw new Error(message);
    }

    setSavedSession(data.session);
    setAnalysisStatus("Report saved.");
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

        {savedSession ? <ReportSummary session={savedSession} /> : null}
      </section>
    </main>
  );
}

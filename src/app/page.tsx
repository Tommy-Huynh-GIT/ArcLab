"use client";

import { useState } from "react";
import {
  ProfilePicker,
  type Profile,
} from "@/components/profile/ProfilePicker";
import { VideoUploadPanel } from "@/components/upload/VideoUploadPanel";

export default function Home() {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [queuedFileName, setQueuedFileName] = useState("");

  function handleSelectProfile(profile: Profile) {
    setSelectedProfile(profile);
    setQueuedFileName("");
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">ArcLab MVP</p>
        <h1>Free throw form analysis with explainable coaching reports.</h1>
        <p className="hero-copy">
          Prepare front-facing free throw clips for ArcLab. Upload previews are
          ready now, with explainable scoring reports coming next.
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
              ? "Upload a front-facing free throw clip to queue a mock analysis preview."
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

          {queuedFileName ? (
            <div className="analysis-status-panel" aria-live="polite">
              <span>Status</span>
              <strong>Mock analysis queued for {queuedFileName}</strong>
              <p>
                No scoring engine has been called yet. This is a local preview
                for the upload flow.
              </p>
            </div>
          ) : null}
        </section>

        {selectedProfile ? (
          <VideoUploadPanel
            onAnalyze={(file) => setQueuedFileName(file.name)}
          />
        ) : null}
      </section>
    </main>
  );
}

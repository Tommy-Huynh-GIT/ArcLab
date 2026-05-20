"use client";

import { useState } from "react";
import {
  ProfilePicker,
  type Profile,
} from "@/components/profile/ProfilePicker";

export default function Home() {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">ArcLab MVP</p>
        <h1>Free throw form analysis with explainable coaching reports.</h1>
        <p className="hero-copy">
          Upload a front-facing free throw clip, analyze core mechanics, and
          review a saved scorecard built for focused practice.
        </p>
      </section>

      <section className="dashboard-grid" aria-label="ArcLab demo dashboard">
        <ProfilePicker onSelect={setSelectedProfile} />

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
              ? "Video upload and pose analysis will appear here in the next ArcLab step."
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
        </section>
      </section>
    </main>
  );
}

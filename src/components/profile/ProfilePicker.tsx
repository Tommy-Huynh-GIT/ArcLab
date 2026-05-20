"use client";

import { useEffect, useState } from "react";

export type Profile = {
  id: string;
  name: string;
  handedness: "LEFT" | "RIGHT";
};

type Props = {
  onSelect: (profile: Profile) => void;
};

function isProfile(value: unknown): value is Profile {
  if (!value || typeof value !== "object") {
    return false;
  }

  const profile = value as Record<string, unknown>;
  return (
    typeof profile.id === "string" &&
    typeof profile.name === "string" &&
    (profile.handedness === "LEFT" || profile.handedness === "RIGHT")
  );
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function ProfilePicker({ onSelect }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [name, setName] = useState("");
  const [handedness, setHandedness] = useState<"LEFT" | "RIGHT">("RIGHT");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profiles")
      .then((response) => response.json())
      .then((data) => setProfiles(data.profiles ?? []))
      .catch(() => setError("Unable to load profiles."));
  }, []);

  async function createProfile() {
    setError("");

    try {
      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, handedness }),
      });

      const data = await readJson(response);

      if (!response.ok) {
        setError(
          data &&
            typeof data === "object" &&
            "error" in data &&
            typeof data.error === "string"
            ? data.error
            : "Unable to create profile.",
        );
        return;
      }

      if (!data || typeof data !== "object" || !("profile" in data)) {
        setError("Unable to create profile.");
        return;
      }

      if (!isProfile(data.profile)) {
        setError("Unable to create profile.");
        return;
      }

      setProfiles((current) => [data.profile, ...current]);
      setName("");
      onSelect(data.profile);
    } catch {
      setError("Unable to create profile.");
    }
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <p className="eyebrow">Demo profiles</p>
        <h2>Choose profile</h2>
      </div>

      <div className="profile-list" aria-label="Profiles">
        {profiles.length === 0 ? (
          <p className="muted">Create a demo player to begin.</p>
        ) : (
          profiles.map((profile) => (
            <button
              className="profile-option"
              key={profile.id}
              onClick={() => onSelect(profile)}
              type="button"
            >
              <span>{profile.name}</span>
              <small>{profile.handedness === "LEFT" ? "Left" : "Right"}</small>
            </button>
          ))
        )}
      </div>

      <div className="profile-form">
        <label>
          <span>Player name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Player name"
          />
        </label>
        <label>
          <span>Handedness</span>
          <select
            value={handedness}
            onChange={(event) =>
              setHandedness(event.target.value as "LEFT" | "RIGHT")
            }
          >
            <option value="RIGHT">Right handed</option>
            <option value="LEFT">Left handed</option>
          </select>
        </label>
        <button onClick={createProfile} type="button">
          Create
        </button>
      </div>

      {error ? <p className="form-error">{error}</p> : null}
    </section>
  );
}

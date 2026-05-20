# ArcLab MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ArcLab's first end-to-end MVP: demo profile selection, video upload, browser pose extraction, backend rules scoring, saved report, report UI, and session history.

**Architecture:** ArcLab is a Next.js App Router application. The browser extracts MediaPipe pose landmarks from a front-facing free throw clip, sends normalized landmark data to server routes, and the server scores and stores reports through Prisma. The MVP keeps raw video client-side and persists only profiles, sessions, key frames, metrics, and analysis reports.

**Tech Stack:** Next.js, TypeScript, React, Prisma, PostgreSQL, MediaPipe Pose Landmarker, Vitest, React Testing Library, Playwright later for smoke testing.

---

## File Structure

- `package.json`: scripts and dependencies.
- `next.config.ts`: Next.js configuration.
- `tsconfig.json`: TypeScript configuration.
- `vitest.config.ts`: unit and integration test configuration.
- `prisma/schema.prisma`: database schema for profiles, sessions, reports, metrics, and key frames.
- `src/app/layout.tsx`: root layout and metadata.
- `src/app/page.tsx`: profile-first dashboard shell.
- `src/app/globals.css`: global visual system.
- `src/app/api/profiles/route.ts`: profile list and create endpoints.
- `src/app/api/sessions/route.ts`: create analyzed session endpoint.
- `src/app/api/profiles/[profileId]/sessions/route.ts`: profile session history endpoint.
- `src/components/profile/ProfilePicker.tsx`: create/select demo profile UI.
- `src/components/upload/VideoUploadPanel.tsx`: video upload, preview, and analysis trigger UI.
- `src/components/report/ReportSummary.tsx`: scorecard and coaching feedback UI.
- `src/components/report/AnnotatedReplay.tsx`: video replay and overlay canvas.
- `src/features/pose/extractPoseLandmarks.ts`: MediaPipe browser extraction adapter.
- `src/features/pose/types.ts`: normalized pose types shared by client and server.
- `src/features/scoring/scoringEngine.ts`: rules-based scoring.
- `src/features/scoring/types.ts`: scoring and report contracts.
- `src/features/scoring/__fixtures__/freeThrowLandmarks.ts`: deterministic landmark fixtures.
- `src/features/scoring/scoringEngine.test.ts`: scoring unit tests.
- `src/lib/db.ts`: Prisma client singleton.

## Branch And PR Sequence

1. `setup/next-app`: scaffold Next.js, TypeScript, lint/test config, baseline UI shell.
2. `feature/demo-profiles`: Prisma schema, profile API, profile picker UI.
3. `feature/video-upload`: upload and preview flow with mock analysis.
4. `feature/scoring-engine`: landmark types, scoring engine, feedback generator, tests.
5. `feature/pose-extraction`: MediaPipe extraction adapter and normalized payload.
6. `feature/report-ui`: persisted analyzed session and scorecard report UI.
7. `feature/session-history`: saved report history for demo profiles.
8. `feature/annotated-replay`: overlay canvas, key frame markers, and replay guides.
9. `feature/polish-and-docs`: README, screenshots, GitHub Actions, final styling pass.

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

- [ ] **Step 1: Create branch**

Run:

```bash
git switch main
git pull --ff-only
git switch -c setup/next-app
```

Expected: new branch `setup/next-app`.

- [ ] **Step 2: Scaffold the app**

Run:

```bash
npx create-next-app@latest . --ts --eslint --app --src-dir --no-tailwind --import-alias "@/*"
```

Expected: Next.js files are created in the repo root. If the command refuses because docs already exist, create a temporary app in `tmp-arclab-app`, copy the generated app files into the root, then remove `tmp-arclab-app`.

- [ ] **Step 3: Install test dependencies**

Run:

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

Expected: packages install successfully and `package-lock.json` updates.

- [ ] **Step 4: Add Vitest config**

Write `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

- [ ] **Step 5: Update package scripts**

Ensure `package.json` includes:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 6: Replace starter page with ArcLab shell**

Write `src/app/page.tsx`:

```tsx
export default function Home() {
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
    </main>
  );
}
```

- [ ] **Step 7: Add baseline styling**

Write `src/app/globals.css`:

```css
:root {
  color-scheme: dark;
  --background: #111111;
  --surface: #1b1b1f;
  --text: #f7f7f4;
  --muted: #b7b7ad;
  --accent: #ff2f4f;
  --accent-2: #32d3ff;
  --line: #34343a;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--background);
  color: var(--text);
  font-family: Arial, Helvetica, sans-serif;
}

.app-shell {
  min-height: 100vh;
  padding: 48px;
}

.hero-panel {
  max-width: 920px;
  border-left: 8px solid var(--accent);
  padding: 32px;
  background: var(--surface);
}

.eyebrow {
  margin: 0 0 16px;
  color: var(--accent-2);
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  max-width: 780px;
  margin: 0;
  font-size: 56px;
  line-height: 1;
}

.hero-copy {
  max-width: 640px;
  color: var(--muted);
  font-size: 20px;
  line-height: 1.5;
}
```

- [ ] **Step 8: Verify scaffold**

Run:

```bash
npm run typecheck
npm run test
npm run build
```

Expected: all commands pass.

- [ ] **Step 9: Commit and push**

Run:

```bash
git add .
git commit -m "chore: scaffold ArcLab Next.js app"
git push -u origin setup/next-app
```

Expected: branch is pushed and ready for a PR.

## Task 2: Add Demo Profiles

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`
- Create: `src/app/api/profiles/route.ts`
- Create: `src/components/profile/ProfilePicker.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create branch**

Run:

```bash
git switch main
git pull --ff-only
git switch -c feature/demo-profiles
```

Expected: new branch `feature/demo-profiles`.

- [ ] **Step 2: Install Prisma**

Run:

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

Expected: Prisma files are created.

- [ ] **Step 3: Define initial schema**

Write `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Profile {
  id         String    @id @default(cuid())
  name       String
  handedness Handedness @default(RIGHT)
  heightCm   Int?
  createdAt  DateTime  @default(now())
  sessions   Session[]
}

model Session {
  id        String   @id @default(cuid())
  profileId String
  profile   Profile  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  title     String
  createdAt DateTime @default(now())
  report    AnalysisReport?
}

model AnalysisReport {
  id           String   @id @default(cuid())
  sessionId    String   @unique
  session      Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  overallScore Int
  rank         String
  summary      String
  createdAt    DateTime @default(now())
  metrics      Metric[]
  keyFrames    KeyFrame[]
}

model Metric {
  id        String @id @default(cuid())
  reportId  String
  report    AnalysisReport @relation(fields: [reportId], references: [id], onDelete: Cascade)
  name      String
  score     Int
  value     Float
  feedback  String
  drill     String
}

model KeyFrame {
  id          String @id @default(cuid())
  reportId    String
  report      AnalysisReport @relation(fields: [reportId], references: [id], onDelete: Cascade)
  label       String
  timestampMs Int
}

enum Handedness {
  LEFT
  RIGHT
}
```

- [ ] **Step 4: Add Prisma client singleton**

Write `src/lib/db.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 5: Add profiles API**

Write `src/app/api/profiles/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const profiles = await prisma.profile.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ profiles });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const handedness = body.handedness === "LEFT" ? "LEFT" : "RIGHT";

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Profile name must be at least 2 characters." },
      { status: 400 },
    );
  }

  const profile = await prisma.profile.create({
    data: { name, handedness },
  });

  return NextResponse.json({ profile }, { status: 201 });
}
```

- [ ] **Step 6: Add ProfilePicker UI**

Write `src/components/profile/ProfilePicker.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

type Profile = {
  id: string;
  name: string;
  handedness: "LEFT" | "RIGHT";
};

type Props = {
  onSelect: (profile: Profile) => void;
};

export function ProfilePicker({ onSelect }: Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [name, setName] = useState("");
  const [handedness, setHandedness] = useState<"LEFT" | "RIGHT">("RIGHT");

  useEffect(() => {
    fetch("/api/profiles")
      .then((response) => response.json())
      .then((data) => setProfiles(data.profiles ?? []));
  }, []);

  async function createProfile() {
    const response = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, handedness }),
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    setProfiles((current) => [data.profile, ...current]);
    setName("");
    onSelect(data.profile);
  }

  return (
    <section className="panel">
      <h2>Choose profile</h2>
      <div className="profile-list">
        {profiles.map((profile) => (
          <button key={profile.id} onClick={() => onSelect(profile)}>
            {profile.name}
          </button>
        ))}
      </div>
      <div className="profile-form">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Player name"
        />
        <select
          value={handedness}
          onChange={(event) => setHandedness(event.target.value as "LEFT" | "RIGHT")}
        >
          <option value="RIGHT">Right handed</option>
          <option value="LEFT">Left handed</option>
        </select>
        <button onClick={createProfile}>Create</button>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Verify profiles**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 8: Commit and push**

Run:

```bash
git add .
git commit -m "feat: add demo profiles"
git push -u origin feature/demo-profiles
```

Expected: branch is pushed and ready for a PR.

## Task 3: Add Scoring Engine

**Files:**
- Create: `src/features/pose/types.ts`
- Create: `src/features/scoring/types.ts`
- Create: `src/features/scoring/scoringEngine.ts`
- Create: `src/features/scoring/__fixtures__/freeThrowLandmarks.ts`
- Create: `src/features/scoring/scoringEngine.test.ts`

- [ ] **Step 1: Create branch**

Run:

```bash
git switch main
git pull --ff-only
git switch -c feature/scoring-engine
```

Expected: new branch `feature/scoring-engine`.

- [ ] **Step 2: Define pose types**

Write `src/features/pose/types.ts`:

```ts
export type PoseLandmarkName =
  | "left_shoulder"
  | "right_shoulder"
  | "left_elbow"
  | "right_elbow"
  | "left_wrist"
  | "right_wrist"
  | "left_hip"
  | "right_hip"
  | "left_knee"
  | "right_knee"
  | "left_ankle"
  | "right_ankle";

export type NormalizedLandmark = {
  name: PoseLandmarkName;
  x: number;
  y: number;
  visibility: number;
};

export type PoseFrame = {
  timestampMs: number;
  landmarks: NormalizedLandmark[];
};

export type PoseAnalysisInput = {
  handedness: "LEFT" | "RIGHT";
  frames: PoseFrame[];
};
```

- [ ] **Step 3: Define scoring types**

Write `src/features/scoring/types.ts`:

```ts
export type MetricName =
  | "stanceWidth"
  | "kneeAlignment"
  | "elbowAlignment"
  | "armExtension"
  | "followThrough";

export type Rank = "D" | "C" | "B" | "A" | "S";

export type MetricScore = {
  name: MetricName;
  label: string;
  score: number;
  value: number;
  feedback: string;
  drill: string;
};

export type KeyFrame = {
  label: "setup" | "dip" | "release" | "followThrough";
  timestampMs: number;
};

export type CoachingReport = {
  overallScore: number;
  rank: Rank;
  summary: string;
  metrics: MetricScore[];
  keyFrames: KeyFrame[];
};
```

- [ ] **Step 4: Write failing scoring tests**

Write `src/features/scoring/scoringEngine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { scoreFreeThrow } from "./scoringEngine";
import { balancedFreeThrow } from "./__fixtures__/freeThrowLandmarks";

describe("scoreFreeThrow", () => {
  it("returns an explainable report for a balanced free throw fixture", () => {
    const report = scoreFreeThrow(balancedFreeThrow);

    expect(report.overallScore).toBeGreaterThanOrEqual(75);
    expect(report.rank).toMatch(/A|S/);
    expect(report.metrics).toHaveLength(5);
    expect(report.keyFrames.map((frame) => frame.label)).toEqual([
      "setup",
      "dip",
      "release",
      "followThrough",
    ]);
  });
});
```

- [ ] **Step 5: Add fixture**

Write `src/features/scoring/__fixtures__/freeThrowLandmarks.ts`:

```ts
import type { PoseAnalysisInput, PoseFrame } from "@/features/pose/types";

const baseLandmarks: PoseFrame["landmarks"] = [
  { name: "left_shoulder", x: 0.42, y: 0.22, visibility: 0.98 },
  { name: "right_shoulder", x: 0.58, y: 0.22, visibility: 0.98 },
  { name: "left_elbow", x: 0.43, y: 0.38, visibility: 0.95 },
  { name: "right_elbow", x: 0.55, y: 0.36, visibility: 0.95 },
  { name: "left_wrist", x: 0.44, y: 0.52, visibility: 0.94 },
  { name: "right_wrist", x: 0.53, y: 0.18, visibility: 0.94 },
  { name: "left_hip", x: 0.44, y: 0.5, visibility: 0.96 },
  { name: "right_hip", x: 0.56, y: 0.5, visibility: 0.96 },
  { name: "left_knee", x: 0.43, y: 0.7, visibility: 0.96 },
  { name: "right_knee", x: 0.57, y: 0.7, visibility: 0.96 },
  { name: "left_ankle", x: 0.4, y: 0.92, visibility: 0.96 },
  { name: "right_ankle", x: 0.6, y: 0.92, visibility: 0.96 },
];

export const balancedFreeThrow: PoseAnalysisInput = {
  handedness: "RIGHT",
  frames: [0, 350, 700, 1050].map((timestampMs) => ({
    timestampMs,
    landmarks: baseLandmarks,
  })),
};
```

- [ ] **Step 6: Implement scoring engine**

Write `src/features/scoring/scoringEngine.ts`:

```ts
import type { PoseAnalysisInput, PoseFrame, PoseLandmarkName } from "@/features/pose/types";
import type { CoachingReport, KeyFrame, MetricScore, Rank } from "./types";

function landmark(frame: PoseFrame, name: PoseLandmarkName) {
  const value = frame.landmarks.find((item) => item.name === name);
  if (!value || value.visibility < 0.5) {
    throw new Error(`Missing visible landmark: ${name}`);
  }
  return value;
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function rankFor(score: number): Rank {
  if (score >= 90) return "S";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

function metric(name: MetricScore["name"], label: string, score: number, value: number, feedback: string, drill: string): MetricScore {
  return { name, label, score: clampScore(score), value, feedback, drill };
}

export function scoreFreeThrow(input: PoseAnalysisInput): CoachingReport {
  if (input.frames.length < 4) {
    throw new Error("At least four pose frames are required.");
  }

  const setup = input.frames[0];
  const dip = input.frames[Math.floor(input.frames.length / 3)];
  const release = input.frames[Math.floor((input.frames.length / 3) * 2)];
  const finish = input.frames[input.frames.length - 1];

  const leftAnkle = landmark(setup, "left_ankle");
  const rightAnkle = landmark(setup, "right_ankle");
  const leftShoulder = landmark(setup, "left_shoulder");
  const rightShoulder = landmark(setup, "right_shoulder");
  const leftKnee = landmark(dip, "left_knee");
  const rightKnee = landmark(dip, "right_knee");
  const shootingElbow = landmark(release, input.handedness === "RIGHT" ? "right_elbow" : "left_elbow");
  const shootingWrist = landmark(release, input.handedness === "RIGHT" ? "right_wrist" : "left_wrist");
  const finishWrist = landmark(finish, input.handedness === "RIGHT" ? "right_wrist" : "left_wrist");

  const stanceWidth = Math.abs(rightAnkle.x - leftAnkle.x);
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
  const stanceRatio = stanceWidth / shoulderWidth;
  const stanceScore = 100 - Math.abs(stanceRatio - 1.25) * 80;

  const kneeCenter = (leftKnee.x + rightKnee.x) / 2;
  const ankleCenter = (leftAnkle.x + rightAnkle.x) / 2;
  const kneeOffset = Math.abs(kneeCenter - ankleCenter);
  const kneeScore = 100 - kneeOffset * 500;

  const shoulderCenter = (leftShoulder.x + rightShoulder.x) / 2;
  const elbowOffset = Math.abs(shootingElbow.x - shoulderCenter);
  const elbowScore = 100 - elbowOffset * 350;

  const extensionValue = Math.max(0, shootingElbow.y - shootingWrist.y);
  const extensionScore = extensionValue * 420;

  const followThroughHold = Math.max(0, shootingElbow.y - finishWrist.y);
  const followThroughScore = followThroughHold * 420;

  const metrics = [
    metric("stanceWidth", "Stance width", stanceScore, stanceRatio, "Your stance is measured against shoulder width.", "Practice 10 reps with feet just wider than shoulders."),
    metric("kneeAlignment", "Knee alignment", kneeScore, kneeOffset, "Your knees should track over the middle of your feet.", "Pause at the dip and check both knees before release."),
    metric("elbowAlignment", "Elbow alignment", elbowScore, elbowOffset, "Your shooting elbow should stay close to your shot line.", "Shoot one-hand form shots from close range."),
    metric("armExtension", "Arm extension", extensionScore, extensionValue, "Your release should finish with strong upward extension.", "Hold your release until the ball reaches the rim."),
    metric("followThrough", "Follow-through", followThroughScore, followThroughHold, "Your wrist and arm should stay high after release.", "Make 20 free throws holding your finish for two seconds."),
  ];

  const overallScore = clampScore(
    metrics.reduce((total, item) => total + item.score, 0) / metrics.length,
  );

  const keyFrames: KeyFrame[] = [
    { label: "setup", timestampMs: setup.timestampMs },
    { label: "dip", timestampMs: dip.timestampMs },
    { label: "release", timestampMs: release.timestampMs },
    { label: "followThrough", timestampMs: finish.timestampMs },
  ];

  return {
    overallScore,
    rank: rankFor(overallScore),
    summary: `ArcLab measured five front-facing free throw mechanics and ranked this attempt ${rankFor(overallScore)}.`,
    metrics,
    keyFrames,
  };
}
```

- [ ] **Step 7: Verify scoring**

Run:

```bash
npm run test -- src/features/scoring/scoringEngine.test.ts
npm run typecheck
```

Expected: tests and typecheck pass.

- [ ] **Step 8: Commit and push**

Run:

```bash
git add src/features
git commit -m "feat: add explainable scoring engine"
git push -u origin feature/scoring-engine
```

Expected: branch is pushed and ready for a PR.

## Task 4: Add Video Upload With Mock Analysis

**Files:**
- Create: `src/components/upload/VideoUploadPanel.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create branch**

Run:

```bash
git switch main
git pull --ff-only
git switch -c feature/video-upload
```

Expected: new branch `feature/video-upload`.

- [ ] **Step 2: Add upload component**

Write `src/components/upload/VideoUploadPanel.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";

type Props = {
  onAnalyze: (file: File) => void;
};

export function VideoUploadPanel({ onAnalyze }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  return (
    <section className="panel">
      <h2>Upload free throw clip</h2>
      <input
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      {previewUrl && (
        <video className="video-preview" src={previewUrl} controls playsInline />
      )}
      <button disabled={!file} onClick={() => file && onAnalyze(file)}>
        Analyze clip
      </button>
    </section>
  );
}
```

- [ ] **Step 3: Wire mock analysis from page**

Update `src/app/page.tsx` to render `VideoUploadPanel` after profile selection. The first version may log the file and show a static "analysis queued" state.

- [ ] **Step 4: Verify upload UI**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 5: Commit and push**

Run:

```bash
git add src/app src/components
git commit -m "feat: add video upload preview"
git push -u origin feature/video-upload
```

Expected: branch is pushed and ready for a PR.

## Task 5: Add Pose Extraction Adapter

**Files:**
- Create: `src/features/pose/extractPoseLandmarks.ts`
- Modify: `src/components/upload/VideoUploadPanel.tsx`

- [ ] **Step 1: Create branch**

Run:

```bash
git switch main
git pull --ff-only
git switch -c feature/pose-extraction
```

Expected: new branch `feature/pose-extraction`.

- [ ] **Step 2: Install MediaPipe**

Run:

```bash
npm install @mediapipe/tasks-vision
```

Expected: package installs successfully.

- [ ] **Step 3: Add extraction adapter**

Write `src/features/pose/extractPoseLandmarks.ts`:

```ts
import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark as MediaPipeLandmark,
} from "@mediapipe/tasks-vision";
import type { NormalizedLandmark, PoseAnalysisInput, PoseLandmarkName } from "./types";

const landmarkMap: Record<number, PoseLandmarkName> = {
  11: "left_shoulder",
  12: "right_shoulder",
  13: "left_elbow",
  14: "right_elbow",
  15: "left_wrist",
  16: "right_wrist",
  23: "left_hip",
  24: "right_hip",
  25: "left_knee",
  26: "right_knee",
  27: "left_ankle",
  28: "right_ankle",
};

let landmarkerPromise: Promise<PoseLandmarker> | null = null;

async function getLandmarker() {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    ).then((vision) =>
      PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      }),
    );
  }

  return landmarkerPromise;
}

function normalizeLandmarks(landmarks: MediaPipeLandmark[]): NormalizedLandmark[] {
  return Object.entries(landmarkMap).map(([index, name]) => {
    const landmark = landmarks[Number(index)];
    return {
      name,
      x: landmark.x,
      y: landmark.y,
      visibility: landmark.visibility ?? 1,
    };
  });
}

export async function extractPoseLandmarks(
  video: HTMLVideoElement,
  handedness: "LEFT" | "RIGHT",
): Promise<PoseAnalysisInput> {
  const landmarker = await getLandmarker();
  const durationMs = video.duration * 1000;
  const sampleCount = 12;
  const frames: PoseAnalysisInput["frames"] = [];

  for (let index = 0; index < sampleCount; index += 1) {
    const timestampMs = Math.round((durationMs / (sampleCount - 1)) * index);
    video.currentTime = timestampMs / 1000;
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });

    const result = landmarker.detectForVideo(video, timestampMs);
    const landmarks = result.landmarks[0];

    if (landmarks) {
      frames.push({
        timestampMs,
        landmarks: normalizeLandmarks(landmarks),
      });
    }
  }

  return { handedness, frames };
}
```

- [ ] **Step 4: Verify extraction build**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 5: Commit and push**

Run:

```bash
git add src/features/pose src/components package.json package-lock.json
git commit -m "feat: extract pose landmarks in browser"
git push -u origin feature/pose-extraction
```

Expected: branch is pushed and ready for a PR.

## Task 6: Persist Analyzed Sessions

**Files:**
- Create: `src/app/api/sessions/route.ts`
- Create: `src/app/api/profiles/[profileId]/sessions/route.ts`
- Modify: `src/components/upload/VideoUploadPanel.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create branch**

Run:

```bash
git switch main
git pull --ff-only
git switch -c feature/report-ui
```

Expected: new branch `feature/report-ui`.

- [ ] **Step 2: Add sessions API**

Write `src/app/api/sessions/route.ts`:

```ts
import { NextResponse } from "next/server";
import { scoreFreeThrow } from "@/features/scoring/scoringEngine";
import type { PoseAnalysisInput } from "@/features/pose/types";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = await request.json();
  const profileId = typeof body.profileId === "string" ? body.profileId : "";
  const title = typeof body.title === "string" ? body.title : "Free throw session";
  const input = body.pose as PoseAnalysisInput | undefined;

  if (!profileId || !input || !Array.isArray(input.frames)) {
    return NextResponse.json({ error: "Invalid session payload." }, { status: 400 });
  }

  const report = scoreFreeThrow(input);

  const session = await prisma.session.create({
    data: {
      profileId,
      title,
      report: {
        create: {
          overallScore: report.overallScore,
          rank: report.rank,
          summary: report.summary,
          metrics: {
            create: report.metrics.map((metric) => ({
              name: metric.name,
              score: metric.score,
              value: metric.value,
              feedback: metric.feedback,
              drill: metric.drill,
            })),
          },
          keyFrames: {
            create: report.keyFrames.map((frame) => ({
              label: frame.label,
              timestampMs: frame.timestampMs,
            })),
          },
        },
      },
    },
    include: {
      report: {
        include: { metrics: true, keyFrames: true },
      },
    },
  });

  return NextResponse.json({ session }, { status: 201 });
}
```

- [ ] **Step 3: Add profile sessions API**

Write `src/app/api/profiles/[profileId]/sessions/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ profileId: string }> },
) {
  const { profileId } = await params;
  const sessions = await prisma.session.findMany({
    where: { profileId },
    orderBy: { createdAt: "desc" },
    include: {
      report: {
        include: { metrics: true, keyFrames: true },
      },
    },
  });

  return NextResponse.json({ sessions });
}
```

- [ ] **Step 4: Add report UI component**

Write `src/components/report/ReportSummary.tsx`:

```tsx
type Metric = {
  id?: string;
  name: string;
  score: number;
  feedback: string;
  drill: string;
};

type Report = {
  overallScore: number;
  rank: string;
  summary: string;
  metrics: Metric[];
};

export function ReportSummary({ report }: { report: Report }) {
  return (
    <section className="panel report-panel">
      <div className="rank-card">
        <span>Rank</span>
        <strong>{report.rank}</strong>
        <span>{report.overallScore}/100</span>
      </div>
      <p>{report.summary}</p>
      <div className="metric-grid">
        {report.metrics.map((metric) => (
          <article key={metric.name} className="metric-card">
            <h3>{metric.name}</h3>
            <strong>{metric.score}</strong>
            <p>{metric.feedback}</p>
            <p>{metric.drill}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Verify session persistence**

Run:

```bash
npm run typecheck
npm run test
npm run build
```

Expected: all commands pass.

- [ ] **Step 6: Commit and push**

Run:

```bash
git add src/app src/components src/features
git commit -m "feat: save analyzed coaching reports"
git push -u origin feature/report-ui
```

Expected: branch is pushed and ready for a PR.

## Task 7: Add Session History

**Files:**
- Create: `src/components/report/SessionHistory.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create branch**

Run:

```bash
git switch main
git pull --ff-only
git switch -c feature/session-history
```

Expected: new branch `feature/session-history`.

- [ ] **Step 2: Add history component**

Write `src/components/report/SessionHistory.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

type Session = {
  id: string;
  title: string;
  createdAt: string;
  report: {
    overallScore: number;
    rank: string;
  } | null;
};

export function SessionHistory({ profileId }: { profileId: string }) {
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    fetch(`/api/profiles/${profileId}/sessions`)
      .then((response) => response.json())
      .then((data) => setSessions(data.sessions ?? []));
  }, [profileId]);

  return (
    <section className="panel">
      <h2>Session history</h2>
      {sessions.map((session) => (
        <article key={session.id} className="history-row">
          <span>{session.title}</span>
          <strong>{session.report?.rank ?? "-"}</strong>
          <span>{session.report?.overallScore ?? 0}/100</span>
        </article>
      ))}
    </section>
  );
}
```

- [ ] **Step 3: Verify history UI**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 4: Commit and push**

Run:

```bash
git add src/components src/app
git commit -m "feat: add profile session history"
git push -u origin feature/session-history
```

Expected: branch is pushed and ready for a PR.

## Task 8: Add Annotated Replay

**Files:**
- Create: `src/components/report/AnnotatedReplay.tsx`
- Modify: `src/components/report/ReportSummary.tsx`

- [ ] **Step 1: Create branch**

Run:

```bash
git switch main
git pull --ff-only
git switch -c feature/annotated-replay
```

Expected: new branch `feature/annotated-replay`.

- [ ] **Step 2: Add replay component**

Write `src/components/report/AnnotatedReplay.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { PoseFrame } from "@/features/pose/types";

type Props = {
  videoUrl: string;
  frames: PoseFrame[];
};

export function AnnotatedReplay({ videoUrl, frames }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const frame = frames[0];
    if (!canvas || !frame) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#ff2f4f";
    context.fillStyle = "#32d3ff";
    context.lineWidth = 3;

    for (const landmark of frame.landmarks) {
      context.beginPath();
      context.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, Math.PI * 2);
      context.fill();
    }
  }, [frames]);

  return (
    <section className="panel replay-panel">
      <video src={videoUrl} controls playsInline />
      <canvas ref={canvasRef} width={640} height={360} aria-label="Pose overlay" />
    </section>
  );
}
```

- [ ] **Step 3: Verify replay**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands pass.

- [ ] **Step 4: Commit and push**

Run:

```bash
git add src/components/report
git commit -m "feat: add annotated replay overlay"
git push -u origin feature/annotated-replay
```

Expected: branch is pushed and ready for a PR.

## Task 9: Add GitHub Actions And README

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `README.md`
- Modify: `docs/superpowers/specs/2026-05-20-arclab-design.md` if implementation discoveries require spec updates.

- [ ] **Step 1: Create branch**

Run:

```bash
git switch main
git pull --ff-only
git switch -c feature/polish-and-docs
```

Expected: new branch `feature/polish-and-docs`.

- [ ] **Step 2: Add CI**

Write `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run test
      - run: npm run build
```

- [ ] **Step 3: Add README**

Write `README.md`:

```md
# ArcLab

ArcLab is a full-stack basketball form coaching app for front-facing free throws. It extracts pose landmarks in the browser, scores mechanics with explainable rules, and saves coaching reports under demo profiles.

## MVP Demo Path

Profile -> upload free throw clip -> analyze -> annotated report -> saved history.

## Stack

- Next.js
- TypeScript
- Prisma
- PostgreSQL
- MediaPipe Pose Landmarker
- Vitest

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

## Verification

\`\`\`bash
npm run typecheck
npm run test
npm run build
\`\`\`
```

- [ ] **Step 4: Verify docs and CI config**

Run:

```bash
npm run typecheck
npm run test
npm run build
```

Expected: all commands pass.

- [ ] **Step 5: Commit and push**

Run:

```bash
git add README.md .github docs
git commit -m "docs: document ArcLab MVP"
git push -u origin feature/polish-and-docs
```

Expected: branch is pushed and ready for a PR.

## Self-Review Notes

- Spec coverage: The plan covers setup, demo profiles, upload, browser pose extraction, backend scoring with feedback generation, persisted reports, session history, annotated replay, GitHub workflow, tests, and docs.
- MVP non-goals are preserved: no production auth, no raw video persistence, no trained ML model, and no mobile camera capture in the first pass.
- The first branch is intentionally setup-only so the GitHub history starts with a clean foundation before feature work.

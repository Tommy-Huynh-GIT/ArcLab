# ArcLab

ArcLab is a basketball shooting-analysis MVP for front-facing free throw clips. It lets a coach or athlete choose a player profile, upload a local video, extract browser-side pose landmarks, score the shot mechanics, and save an explainable coaching report with session history and annotated replay.

The current MVP is built as a single Next.js app with a Prisma-backed API. Raw video stays client-side in the MVP; the server receives pose landmarks and report data, not the uploaded video file.

## MVP Demo Path

1. Run the app locally and open `http://localhost:3000`.
2. Create or select a demo profile.
3. Upload a front-facing free throw clip.
4. Review the generated score, metric explanations, key frames, saved report, session history, and annotated replay.

## Features

- Demo player profiles with handedness selection.
- Local video upload for front-facing free throw clips.
- Browser pose extraction with MediaPipe Tasks Vision.
- Explainable scoring across stance width, knee alignment, elbow alignment, arm extension, and follow-through.
- Saved reports with overall score, rank, metric feedback, drills, and key frames.
- Session history per profile.
- Annotated replay for the analyzed clip with key-frame markers.

## Architecture

- `src/app/page.tsx`: main MVP dashboard and client orchestration.
- `src/components/profile`: profile selection and profile creation UI.
- `src/components/upload`: local video upload, preview, and analysis trigger UI.
- `src/components/report`: report summary, session history, and annotated replay components.
- `src/app/api`: API routes for profiles, sessions, and profile session history.
- `src/features/pose`: MediaPipe pose extraction and pose landmark types.
- `src/features/scoring`: scoring engine, geometry helpers, validation, feedback, fixtures, and tests.
- `src/lib/db.ts`: Prisma client setup.
- `prisma/schema.prisma`: PostgreSQL data model for profiles, sessions, reports, metrics, and key frames.
- `prisma/migrations`: database migration history.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- MediaPipe Tasks Vision
- Prisma 7
- PostgreSQL
- Vitest and Testing Library
- ESLint
- GitHub Actions

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Set the database URLs in `.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/arclab"
SHADOW_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/arclab_shadow"
```

Generate the Prisma client:

```bash
npx prisma generate
```

Apply migrations for local development:

```bash
npx prisma migrate dev
```

Start the dev server:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Verification

Run the same checks used by CI:

```bash
npx prisma validate
npx prisma generate
npm run typecheck
npm run lint
npm run test
npm run build
```

The GitHub Actions workflow also runs on pull requests and pushes to `main` with Node 22, `npm ci`, Prisma client generation, typecheck, lint, tests, and build.

## Project Workflow

Work starts from an updated `main` branch. Feature and documentation changes should land on a focused branch, then be pushed for pull request review before merging back to `main`.

# ArcLab Design

## Purpose

ArcLab is a full-stack basketball form coaching app for front-facing free throws. It helps a user upload a short clip, analyze their shooting form, and review a saved coaching report with annotated replay, explainable scores, and suggested drills.

The project is built as a portfolio-grade engineering project, not a throwaway demo. It should show product thinking, full-stack architecture, computer vision integration, explainable scoring, testing discipline, and a clean GitHub history with sequential feature branches and pull requests.

## Target User

The MVP targets basketball players who want quick, understandable feedback on free throw mechanics. The first version focuses on front-facing free throw clips because the motion is repeatable, landmarks are visible, and feedback can be concrete without overclaiming biomechanical precision.

## Product Shape

The user creates or selects a demo profile, uploads a short front-facing free throw clip, waits through an analysis step, then gets a saved coaching report.

The report has two primary parts:

- Annotated replay with pose landmarks and alignment guides.
- Scorecard with an overall rank, sub-scores, coaching fixes, and suggested drills.

The app should feel energetic and memorable, with Persona-inspired but legally distinct presentation: bold contrast, sharp panels, rank cards, confident motion, and original visual language. It must not use Persona names, logos, characters, music, copied layouts, or other copyrighted assets.

## MVP Flow

1. Select or create a demo profile.
2. Upload a short front-facing free throw clip.
3. Preview the clip before analysis.
4. Extract pose landmarks in the browser.
5. Send normalized landmark data to the backend.
6. Generate a rules-based coaching report.
7. Save the report to the selected profile.
8. Show the report with:
   - Overall form score and rank.
   - Sub-scores.
   - Key frame timestamps with still-frame previews when browser APIs allow it.
   - Annotated replay overlay.
   - Three coaching fixes.
   - Suggested drills.
9. Return to profile history to compare sessions.

The first complete milestone is: profile selection, upload, analysis, saved report, and report viewing.

## Technical Architecture

ArcLab will use Next.js and TypeScript as the full-stack application framework.

The frontend owns:

- Demo profile selection and creation.
- Video upload and preview.
- Browser-based pose extraction.
- Annotated replay.
- Report and history UI.

The backend owns:

- Receiving normalized landmark payloads.
- Running the rules-based scoring engine.
- Generating structured coaching feedback.
- Saving sessions and reports.
- Serving profile history and report data.

Pose extraction runs in the browser using MediaPipe Pose Landmarker. The backend receives normalized landmark data rather than raw video. This keeps the MVP fast, avoids server GPU complexity, and still demonstrates full-stack product engineering.

PostgreSQL and Prisma will store profiles, sessions, reports, key frames, and metrics.

Raw video should stay client-side for the MVP. The durable saved artifact is the analysis report and derived metric data. If saved replay across devices becomes important later, object storage can be added.

## Data Model

The MVP data model should stay small but real.

Core entities:

- `Profile`: demo user/player profile with name, handedness, optional height, and creation date.
- `Session`: one analyzed free throw clip or attempt tied to a profile.
- `AnalysisReport`: overall score, rank, sub-scores, generated feedback, and drill recommendations.
- `KeyFrame`: important shot moments such as setup, dip, release, and follow-through.
- `Metric`: normalized measurements such as stance width ratio, knee alignment offset, elbow angle, arm extension, and follow-through hold.

The schema should support progress history without requiring production authentication in the MVP.

## Scoring And Feedback

The MVP scoring engine will be rules-based and explainable. It receives normalized pose landmarks from front-facing free throw clips and computes a small set of basketball form metrics.

Initial metrics:

- Stance width: compare ankle distance to shoulder or hip width.
- Knee alignment: check whether knees track over feet during dip and release.
- Shooting elbow alignment: estimate whether the shooting elbow stays near the centerline or shot path.
- Arm extension: check whether the shooting arm reaches strong extension near release.
- Follow-through symmetry and hold: check wrist and arm finish position and whether the finish is held briefly.

The scoring engine converts metrics into sub-scores, an overall score, and a rank from `D` to `S`. Feedback must be specific and humble. It should say what the app measured, not pretend to be a certified coach. Each weak metric maps to one suggested drill.

The roadmap can include data collection and personalized ML later, but the MVP should not claim to use a trained model.

## Demo Profiles

The MVP will use lightweight demo profiles instead of production authentication. A user can create or select a profile, run analyses, and view saved session history for that profile.

This provides a real product loop without spending early project time on authentication plumbing:

Profile -> upload -> analyze -> report -> history.

## Visual And Interaction Direction

ArcLab should feel like a serious sports-tech product with stylish energy.

Design principles:

- Bold contrast and sharp layout.
- Original rank cards and training report visuals.
- Snappy but restrained transitions.
- Clear hierarchy for scores, feedback, and replay controls.
- No copied Persona assets, names, music, fonts, or exact UI recreations.

The first version should prioritize clarity over decoration. The user should immediately understand what was measured, where the issue appears, and what to try next.

## Testing And Verification

Testing should focus on the highest-risk parts of the product:

- Scoring engine unit tests using landmark fixtures.
- Report generation tests for feedback and drill selection.
- API route tests for malformed payloads, missing records, and successful report saves.
- Basic UI flow testing once the core flow stabilizes.

Each pull request should include a short test note. After the app has a stable core, GitHub Actions should run lint, typecheck, and tests on every PR.

## GitHub Workflow

ArcLab should be developed with a clean, sequential GitHub history.

Repository rules:

- `main` stays stable and runnable.
- Work happens on focused branches.
- Each major capability lands through a pull request.
- Pull requests include a summary, test notes, and screenshots for UI work.
- Core scoring changes include unit tests.

Planned branch sequence:

- `setup/next-app`
- `feature/demo-profiles`
- `feature/video-upload`
- `feature/pose-extraction`
- `feature/scoring-engine`
- `feature/report-ui`
- `feature/session-history`
- `feature/annotated-replay`
- `feature/polish-and-docs`

The project should also use GitHub Issues or a project board with labels such as `MVP`, `frontend`, `backend`, `cv-pipeline`, `scoring`, `polish`, and `docs`.

## Non-Goals For MVP

The MVP will not include:

- Production authentication.
- Server-side video processing.
- Raw video persistence.
- A trained ML model.
- Mobile-first camera capture.
- Full jump shot, dribbling, layup, or game-footage analysis.
- Copyrighted Persona assets or exact UI recreation.

## Success Criteria

The MVP is successful when a recruiter can clone or open the project and understand:

- What ArcLab does.
- How the full-stack flow works.
- How pose landmarks become explainable coaching feedback.
- How sessions persist across demo profiles.
- How the project was built through clear branches and PRs.

The key demo path must work end to end:

Profile -> upload front-facing free throw clip -> analyze -> annotated coaching report -> saved history.

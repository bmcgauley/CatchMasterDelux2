# Tasks: Vercel + Payload Migration

Feature: `001-vercel-payload-migration`  
Location: `specs/001-vercel-payload-migration/`  
Generated: 2025-10-29

Phase 1 — Setup (project initialization)

- [ ] T001 Create `.env.payload.example` at `payload/.env.example` with keys: PAYLOAD_SECRET, DATABASE_URL, VERCEL_BLOB_TOKEN, VERCEL_BLOB_BUCKET, SUPABASE_URL, SUPABASE_KEY. This is a non-secret example file used by devs.
- [ ] T002 [P] Create a minimal `payload/package.json` at `payload/package.json` with scripts: `dev`, `build`, `start`, and dependencies `payload` + `@payloadcms/storage-vercel-blob`.
- [ ] T003 [P] Add npm scripts to root `package.json`: `dev:payload` -> `cd payload && npx payload dev`, `dev:client` -> `cd client && npm run dev`, `start` -> `node app.js`.
- [ ] T004 Create `specs/001-vercel-payload-migration/.env.migration.example` with MIGRATION_ACTIVE_WINDOW_MONTHS (default 12), MIGRATION_BATCH_SIZE (default 50) and DRY_RUN flag. File path: `specs/001-vercel-payload-migration/.env.migration.example`.
- [ ] T005 Create CI skeleton with security-audit gate at `.github/workflows/ci.yml` that runs: install, lint, tests, and a placeholder `security-audit` job (must be required before merge to `master` per project policy). File path: `.github/workflows/ci.yml`.
- [ ] T006 Create `specs/001-vercel-payload-migration/migration-config.json` capturing migration defaults (activeWindowMonths, batchSize, retentionDays). File path: `specs/001-vercel-payload-migration/migration-config.json`.

Phase 2 — Foundational (blocking prerequisites — complete before user stories)

- [ ] T007 [P] [US2] Create Payload collection `mediaAssets` at `payload/collections/mediaAssets.js` with fields: filename, mimeType, size, storageProvider, providerUrl, providerKey, checksum, uploadedBy (relation to users), uploadedAt, metadata, legacyMetadata.
- [ ] T008 [P] [US1] Create Payload collection `users` at `payload/collections/users.js` with fields: authUid, email, displayName, avatar (relation), lastActiveAt, legacyMetadata.
- [ ] T009 [P] [US1] Create Payload collection `gameInstances` at `payload/collections/gameInstances.js` with fields: user (relation), gameId, state (JSON), createdAt, updatedAt, legacyMetadata.
- [ ] T010 Implement Vercel Blob storage adapter in `payload/config/storage.js` using `@payloadcms/storage-vercel-blob` and wire it into `payload/config/index.js` (file paths: `payload/config/storage.js`, `payload/config/index.js`).
- [ ] T011 Create a migration log table SQL file at `specs/001-vercel-payload-migration/migrations/migration_log_table.sql` defining columns: jobId, sourceRef, destRef, status, errorMessage, attemptCount, createdAt, updatedAt.
- [ ] T012 Create migration job runner skeleton at `specs/001-vercel-payload-migration/migrations/runner.js` with exported functions: `enqueueJob(jobSpec)`, `runJob(jobId)`, `resumeJob(jobId)`; include dry-run support and checkpointing placeholders.
- [ ] T013 [P] Create a Supabase wrapper config at `lib/supabaseClient.js` that exports a `getSupabaseClient()` function and reads SUPABASE_URL / SUPABASE_KEY from environment. File path: `lib/supabaseClient.js`.
- [ ] T014 Implement structured logging util at `lib/logging.js` exporting `logInfo`, `logError`, `logDebug` that output JSON with correlationId support. File path: `lib/logging.js`.

Phase 3 — User Story phases (priority order)

US1 — Migrate media storage to Vercel Blob (Priority: P1)
Goal: Move media objects from Firebase to Vercel Blob and update DB references. Independent test: POC migration of 10 users/media completes with updated DB records and valid blob URLs.

- [ ] T015 [US1] Create mapping script `specs/001-vercel-payload-migration/migrations/mapping/firebase-to-payload.js` that defines how Firebase user/doc fields map to Payload fields (users, mediaAssets, gameInstances). Include comment examples and sample input/output.
- [ ] T016 [US1] Create a POC migration script `specs/001-vercel-payload-migration/migrations/poc-migrate-10.js` that: reads a small sample from Firebase export (sample file path `specs/001-vercel-payload-migration/migrations/sample-firebase-export.json`), copies media objects to Vercel Blob (using adapter), writes `mediaAssets` records, and reports checksums. Must support `--dry-run` flag and produce `specs/001-vercel-payload-migration/migrations/poc-report.json` on success.
- [ ] T017 [US1] Implement upload API endpoint `backend/api/upload.js` (or `api/upload.js` if using Next.js API routes) to accept multipart/form-data, upload to Vercel Blob, create `mediaAssets` record in Payload (or DB), and return providerUrl. Add clear TODO in the file header if location differs.
- [ ] T018 [P] [US1] Add unit tests for the mapping logic in `tests/unit/migration-mapping.test.js` covering 3 sample cases (image, avatar, missing fields) and assert expected payload records.
- [ ] T019 [US1] Add an integration test `tests/integration/migration-poc.test.js` that runs the POC migration in dry-run and validates `poc-report.json` contains zero critical failures.
- [ ] T020 [US1] Update frontend upload flow: create/modify `client/src/services/upload.js` and `client/src/components/UploadButton.js` to call the new upload endpoint, show progress, and display user-facing errors for size/limit issues.

US2 — Integrate Payload CMS & CMS assets (Priority: P1)
Goal: Allow editors to manage site content via Payload and store CMS media in Vercel Blob. Independent test: Editor creates content with image and site renders published content.

- [ ] T021 [US2] Create Payload collection `content` at `payload/collections/content.js` (fields: slug, title, body (rich text/markdown), images relation to `mediaAssets`) and include adminUI labels.
- [ ] T022 [US2] Ensure Payload config (`payload/config/index.js`) wires `mediaAssets` collection and storage adapter; if necessary, update `payload/config/index.js` (file path: `payload/config/index.js`).
- [ ] T023 [US2] Add a CMS seed script `specs/001-vercel-payload-migration/scripts/seed-cms.js` that creates an example landing page and attaches a sample media asset (used in quickstart acceptance test).
- [ ] T024 [US2] Add a contract test `tests/contract/payload-content.test.js` that validates publish → site-read round-trip using the Payload REST API (or SDK) against a local dev instance.
- [ ] T025 [US2] Document editor onboarding and publishing steps in `specs/001-vercel-payload-migration/docs/editor-onboarding.md` and link it from `specs/001-vercel-payload-migration/quickstart.md`.

US3 — Configure Supabase fallback & auth option (Priority: P2)
Goal: Provide a fallback path for media/data operations and optional auth provider. Independent test: Simulated primary upload failure triggers Supabase fallback and results in a valid asset record.

- [ ] T026 [US3] Implement Supabase client wrapper at `lib/supabaseClient.js` (if not already created in T013) or extend it to include storage fallback functions: `uploadToSupabaseStorage(fileBuffer, key)`.
- [ ] T027 [P] [US3] Implement fallback logic in upload service `backend/services/uploadService.js`: try Vercel Blob, on error attempt Supabase, mark `mediaAssets.storageProvider` accordingly.
- [ ] T028 [US3] Add integration test `tests/integration/supabase-failover.test.js` that mocks Vercel Blob failure and asserts Supabase fallback succeeded and DB record updated.
- [ ] T029 [US3] Add a runbook `specs/001-vercel-payload-migration/docs/supabase-failover.md` describing environment variables, monitoring signals, and manual remediation steps.

US4 — UI refresh using shadcn & runtime bug fixes (Priority: P2)
Goal: Update UI components for consistent styling and fix blocking runtime bugs. Independent test: E2E smoke tests pass for key flows (signup/login, add game, upload media, view Pokebox).

- [ ] T030 [US4] Replace/add shadcn UI primitives: create `client/src/components/ui/Button.tsx`, `client/src/components/ui/Input.tsx`, and `client/src/components/ui/Card.tsx` following the shadcn pattern; add TSX or JS files depending on repo type.
- [ ] T031 [P] [US4] Update layout and styles in `client/src/index.css` and `client/src/components/Layout.js` to ensure responsive behavior; include Tailwind utility classes where applicable.
- [ ] T032 [US4] Add Playwright smoke test `tests/e2e/smoke.spec.ts` that exercises key flows; place config at `tests/e2e/playwright.config.ts`.
- [ ] T033 [US4] Fix runtime integration in `app.js` (or `server/index.js`) to read new storage provider config and gracefully handle missing tokens; update file `app.js` with a feature flag for legacy Firebase mode.
- [ ] T034 [US4] Add accessibility/unit tests for new UI components `tests/unit/a11y-ui.test.js` (using axe or jest-axe) to ensure basic a11y rules pass.

Final Phase — Polish & Cross-cutting Concerns

- [ ] T035 [P] Create migration monitoring notes and a lightweight dashboard spec at `specs/001-vercel-payload-migration/migrations/dashboard.md` describing metrics to capture (counts, failures, tpm, lastRun).
- [ ] T036 Create `specs/001-vercel-payload-migration/migrations/retention-rollback.md` describing retention windows, rollback plan steps, and how to revert providerUrl references.
- [ ] T037 Create `specs/001-vercel-payload-migration/security/security-audit.md` checklist that the CI `security-audit` job will run; include SCA, dependency checks, and config review.
- [ ] T038 Add CI protection: update `.github/workflows/ci.yml` to require the `security-audit` job and enforce test coverage thresholds for merge to `master`.

Dependencies (story completion order)

- Setup (Phase 1) → Foundational (Phase 2) → User Stories (Phase 3)
- Within Phase 3: US1 and US2 are P1 and should be implemented immediately after Foundational tasks; US3 and US4 follow (P2).
- Recommended execution order: T001..T006 → T007..T014 → (T015..T020 and T021..T025 in parallel as separate teams) → T026..T029 → T030..T034 → T035..T038.

Parallel execution examples

- Team A (backend infra): T007, T008, T009, T010, T011, T012 can be implemented in parallel (independent files).
- Team B (migration tooling): T015, T016, T019 can be implemented in parallel with Team A after T010 and T012 are created.
- Team C (frontend & UI): T020, T030, T031, T032 can be implemented in parallel (different files) once T017 upload endpoint contract is defined.
- Team D (Supabase & fallback): T026, T027, T028 can run in parallel once T013 exists.

Implementation strategy (MVP first, incremental delivery)

- MVP scope: Deliver US1 POC end-to-end (T015..T020) so uploads and a small migration sample succeed. This minimizes risk and proves the storage wiring.
- Incremental: After MVP, deliver US2 (Payload CMS integration) and then Supabase fallback + UI polish. Each story should be independently testable using the tests described above.
- Safety: All migration operations run as `--dry-run` by default. Enable idempotency and checkpointing before non-dry runs. Keep legacy references for a configurable retention window.

Validation: All tasks above follow the checklist format `- [ ] T### [P?] [US?] Description with file path` required by project tooling.

Artifacts produced

- `specs/001-vercel-payload-migration/tasks.md` (this file)
- Migration scripts and runner: `specs/001-vercel-payload-migration/migrations/`
- Payload config: `payload/config/*`, `payload/collections/*`
- Tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`, `tests/contract/`
- Docs: `specs/001-vercel-payload-migration/docs/` and quickstart updates

## Summary Report

- Total tasks: 38
- Tasks per story / phase:
  - Phase 1 (Setup): 6
  - Phase 2 (Foundational): 8
  - US1 (P1): 6
  - US2 (P1): 5
  - US3 (P2): 4
  - US4 (P2): 5
  - Final/Polish: 4
- Parallel opportunities: Many (backend infra, migration tooling, frontend UI, Supabase fallback) — see Parallel execution examples above.
- Independent test criteria: Each story includes an independent test — POC migration, CMS publish round-trip, Supabase failover simulation, and E2E smoke suite for UI.
- Suggested MVP: Only User Story 1 (media migration POC) — tasks T015..T020 plus foundational setup T007..T014 and Phase 1 setup T001..T006.
- Format validation: All tasks follow the checklist format; tasks include file paths and (where relevant) [P] and [USn] labels.

End of file

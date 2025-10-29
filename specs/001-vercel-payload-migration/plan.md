# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Migrate the project's media and CMS stack from Firebase to Vercel Blob for media storage and Payload CMS (Postgres-backed) for editorial content, with Supabase configured as a backup data/auth option. Integrate shadcn UI components and update the frontend to work with the new storage/CMS contracts. Produce scriptable migration tasks for existing Firebase media references and a tested failover path to Supabase. Add unit, integration and E2E smoke tests and structured logging for critical flows. Deliverables: migration scripts, Payload CMS integration, Vercel Blob wiring, Supabase fallback config, UI refresh, CI updates, and smoke test suite.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: Node.js 18+ / TypeScript (project uses Next 16 / React 19 in packages)
**Primary Dependencies**: Next.js ^16, Payload CMS ^3.61.1, @vercel/blob, @payloadcms/storage-vercel-blob, @supabase/supabase-js
**Storage**: Vercel Blob for media; Postgres (managed) for Payload CMS content; Supabase (Postgres) as fallback/backup data store
**Testing**: Vitest for unit, Playwright for E2E, basic integration tests (supabase/payload contract tests)
**Target Platform**: Vercel (production); local dev via next dev / payload local
**Project Type**: Web application (frontend + backend) — Next.js frontend + Payload CMS admin (server-side)
**Performance Goals**: N/A initially — optimize for responsiveness and acceptable page load; enforce streamingable media and lazy-loading
**Constraints**: Vercel Blob file size and bandwidth limits; Postgres connection limits on hosted plan; must avoid embedding secrets in repo
**Scale/Scope**: Early-stage SaaS-scale (tens of thousands of users target) — plan for migration of a sample dataset (100 users) as acceptance

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The following gates are derived from the project constitution and MUST be addressed in Phase 0 research and again in Phase 1 design:

- User Data Safety & Privacy: Identify any personal or game-related data touched by the feature; document storage, retention, and access controls.
- Test-First: Provide a list of mandatory tests (unit, contract, integration) and where they will live.
- Observability: Specify what structured logs, tracing, or health checks will be added for the feature.
- Semantic Versioning Impact: State whether the change affects public contracts or data schemas and the proposed versioning strategy + migration plan.
- Simplicity Justification: If the feature increases complexity, include a short justification and alternatives considered.

If any gate cannot be satisfied in Phase 0, list mitigation steps and explicit acceptance criteria for moving forward.

Current gate notes:
- User Data Safety & Privacy: All media will be migrated to Vercel Blob with secure URLs and documented retention. Migration scripts MUST redact or securely handle any sensitive metadata.
- Test-First: CI will be updated to run unit + integration + E2E smoke before merges to main. Feature branches must include tests for modified flows.
- Observability: Add structured logs for upload, publish, migration jobs, and auth; log format JSON with correlation IDs.
- Semantic Versioning Impact: Storage URL formats and data contracts will change; plan a MINOR bump and compatibility tests. MAJOR only if public API contracts change.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: Use Option 2: Web application layout

Selected structure (existing repo mapping):

frontend/
- `client/` — Next.js app (pages/app integration, UI components in `client/src/components`)

backend/
- `payload/` — Payload CMS instance (server admin) and Postgres connection
- `api/` or `app.js` — server code that wires uploads and app API endpoints (existing `app.js` remains entry)

Storage & artifacts:
- Vercel Blob configured via `@payloadcms/storage-vercel-blob` for Payload assets
- MediaAsset records in DB reference `vercel-blob` URLs

Notes: Remove legacy Firebase persistence code paths behind feature toggle until migration completes.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

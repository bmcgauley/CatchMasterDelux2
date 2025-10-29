# Feature Specification: Vercel + Payload Migration

**Feature Branch**: `001-vercel-payload-migration`  
**Created**: 2025-10-29  
**Status**: Draft  
**Input**: User description: "Get project back up and running using Vercel Blob storage instead of Firebase, Supabase as a fallback, integrate shadcn and Payload CMS, and fix remaining bugs to reach a deployable state with the new frameworks." 

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Migrate media storage to Vercel Blob (Priority: P1)

As a user I want my uploaded images and game media to be stored and served reliably so that my game progress and assets are preserved and visible in the app.

Why this priority: Media storage is foundational to the app (sprites, box images, covers). Without a working storage backend the app is not deployable.

Independent Test: Upload a representative image from the client; verify the upload returns a stable URL, the image is retrievable in read-only requests, and references in the app resolve correctly.

Acceptance Scenarios:
1. Given a logged-in test user, when they upload a media asset, then the asset is persisted to Vercel Blob and reachable via the returned URL.
2. Given a migrated game record with media references, when the client renders the Pokebox or item list, then images load without error.

---

### User Story 2 - Integrate Payload CMS for content and Vercel Blob for CMS assets (Priority: P1)

As a content editor I want to manage static content (landing pages, guides, curated game data) in Payload CMS and have its media stored in Vercel Blob so editors can update site content without code deploys.

Why this priority: Content management decouples editorial changes from code and is required for production readiness.

Independent Test: Create/edit a content entry in Payload admin, attach an image, publish; verify the site renders updated content and that the CMS asset is stored in Vercel Blob.

Acceptance Scenarios:
1. Given a Payload admin user, when they create content with image attachments, then the images are stored in Vercel Blob and the public site shows the new content after publish.

---

### User Story 3 - Configure Supabase as backup and (optionally) authentication provider (Priority: P2)

As an operator I want Supabase configured as a fallback for data or auth so the application has redundancy and a path to replace Firebase where needed.

Why this priority: Ensures resilience and provides an alternative data/auth store during migration.

Independent Test: Simulate primary datastore outage (or switch environment variables) and verify reads/writes succeed against Supabase for test flows defined in FRs.

Acceptance Scenarios:
1. Given primary services set to Vercel Blob + Payload, when a failover is triggered, then critical reads/writes succeed against Supabase-backed endpoints (for the tested subset of flows).

---

### User Story 4 - UI refresh using shadcn & fix remaining runtime bugs (Priority: P2)

As a user I want UI components updated for consistency and responsive behavior so the product feels polished and usable.

Why this priority: UX polish reduces support overhead and increases likelihood of adoption; some remaining bugs block basic flows.

Independent Test: Run a set of smoke/end-to-end tests that exercise signup/login, adding a game to collection, viewing Pokebox, and uploading a media asset.

Acceptance Scenarios:
1. Given a set of representative flows, when automated E2E tests run, then they pass with no critical failures.

---

### Edge Cases

- Upload large files (e.g., > 10MB): ensure uploads fail gracefully with user-facing message and do not corrupt state.
- Partial migration: handle records missing media or with legacy Firebase URLs by showing placeholders and queuing for reupload.
- Rate-limiting or blob API errors: surface clear retry guidance and prevent duplicate records.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The system MUST store all user-uploaded media (avatars, sprites, box images, cover art) in Vercel Blob and reference the resulting URLs from app data records.
- **FR-002**: Payload CMS MUST be integrated as the primary CMS for editorial content; CMS-managed media MUST also be stored in Vercel Blob.
- **FR-003**: Supabase MUST be configured as a backup data store and, if chosen, as an authentication provider for migration; configuration MUST support an operational failover test.
- **FR-004**: There MUST be a documented migration path for existing Firebase data (media references and user/game records); migration tasks MUST be scriptable and reversible where feasible. Migration scope decision: selective migration of active users by default.

  Details: The migration will migrate users active in the last 12 months (configurable via MIGRATION_ACTIVE_WINDOW_MONTHS). Provide an on-demand migration CLI/API for inactive users and administrative backfills. All migration operations MUST be idempotent, checkpointed, and retain legacy metadata for a configurable retention window.
- **FR-005**: The application MUST build and run in a Vercel deployment environment with environment-driven configuration for storage, CMS, and auth.
- **FR-006**: Automated tests (unit + integration + a small E2E smoke suite) MUST be added or updated to cover core flows: auth, media upload, content rendering, and game progress persistence.
- **FR-007**: Observability: The system MUST emit structured logs for uploads, CMS publishes, auth failures, and migration jobs to aid debugging.

### Key Entities *(include if feature involves data)*

- **User**: id, username/email, auth provider id (if migrated), list of owned game instances, preferences
- **GameInstance**: id, gameId, ownership metadata (condition, purchase date, price), media references (cover URL, box images)
- **PokemonRecord**: id, gameInstanceId, pokedexNumber, status (seen/caught/shiny), party status
- **MediaAsset**: id, storageProvider (vercel-blob), url, checksum, ownerId, uploadedAt
- **CMSContent**: payload-managed document structures used for landing pages, guides, and curated lists

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.

### Measurable Outcomes

```markdown
# Feature Specification: Vercel + Payload Migration

**Feature Branch**: `001-vercel-payload-migration`  
**Created**: 2025-10-29  
**Status**: Draft  
**Input**: User description: "Get project back up and running using Vercel Blob storage instead of Firebase, Supabase as a fallback, integrate shadcn and Payload CMS, and fix remaining bugs to reach a deployable state with the new frameworks." 

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Migrate media storage to Vercel Blob (Priority: P1)

As a user I want my uploaded images and game media to be stored and served reliably so that my game progress and assets are preserved and visible in the app.

Why this priority: Media storage is foundational to the app (sprites, box images, covers). Without a working storage backend the app is not deployable.

Independent Test: Upload a representative image from the client; verify the upload returns a stable URL, the image is retrievable in read-only requests, and references in the app resolve correctly.

Acceptance Scenarios:
1. Given a logged-in test user, when they upload a media asset, then the asset is persisted to Vercel Blob and reachable via the returned URL.
2. Given a migrated game record with media references, when the client renders the Pokebox or item list, then images load without error.

---

### User Story 2 - Integrate Payload CMS for content and Vercel Blob for CMS assets (Priority: P1)

As a content editor I want to manage static content (landing pages, guides, curated game data) in Payload CMS and have its media stored in Vercel Blob so editors can update site content without code deploys.

Why this priority: Content management decouples editorial changes from code and is required for production readiness.

Independent Test: Create/edit a content entry in Payload admin, attach an image, publish; verify the site renders updated content and that the CMS asset is stored in Vercel Blob.

Acceptance Scenarios:
1. Given a Payload admin user, when they create content with image attachments, then the images are stored in Vercel Blob and the public site shows the new content after publish.

---

### User Story 3 - Configure Supabase as backup and (optionally) authentication provider (Priority: P2)

As an operator I want Supabase configured as a fallback for data or auth so the application has redundancy and a path to replace Firebase where needed.

Why this priority: Ensures resilience and provides an alternative data/auth store during migration.

Independent Test: Simulate primary datastore outage (or switch environment variables) and verify reads/writes succeed against Supabase for test flows defined in FRs.

Acceptance Scenarios:
1. Given primary services set to Vercel Blob + Payload, when a failover is triggered, then critical reads/writes succeed against Supabase-backed endpoints (for the tested subset of flows).

---

### User Story 4 - UI refresh using shadcn & fix remaining runtime bugs (Priority: P2)

As a user I want UI components updated for consistency and responsive behavior so the product feels polished and usable.

Why this priority: UX polish reduces support overhead and increases likelihood of adoption; some remaining bugs block basic flows.

Independent Test: Run a set of smoke/end-to-end tests that exercise signup/login, adding a game to collection, viewing Pokebox, and uploading a media asset.

Acceptance Scenarios:
1. Given a set of representative flows, when automated E2E tests run, then they pass with no critical failures.

---

### Edge Cases

- Upload large files (e.g., > 10MB): ensure uploads fail gracefully with user-facing message and do not corrupt state.
- Partial migration: handle records missing media or with legacy Firebase URLs by showing placeholders and queuing for reupload.
- Rate-limiting or blob API errors: surface clear retry guidance and prevent duplicate records.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST store all user-uploaded media (avatars, sprites, box images, cover art) in Vercel Blob and reference the resulting URLs from app data records.
- **FR-002**: Payload CMS MUST be integrated as the primary CMS for editorial content; CMS-managed media MUST also be stored in Vercel Blob.
- **FR-003**: Supabase MUST be configured as a backup data store and, if chosen, as an authentication provider for migration; configuration MUST support an operational failover test.
- **FR-004**: There MUST be a documented migration path for existing Firebase data (media references and user/game records); migration tasks MUST be scriptable and reversible where feasible. **[NEEDS CLARIFICATION: Scope of migration for historical user data — full user-profile/game history migration vs. selective migration of active users?]**
- **FR-005**: The application MUST build and run in a Vercel deployment environment with environment-driven configuration for storage, CMS, and auth.
- **FR-006**: Automated tests (unit + integration + a small E2E smoke suite) MUST be added or updated to cover core flows: auth, media upload, content rendering, and game progress persistence.
- **FR-007**: Observability: The system MUST emit structured logs for uploads, CMS publishes, auth failures, and migration jobs to aid debugging.

### Key Entities *(include if feature involves data)*

- **User**: id, username/email, auth provider id (if migrated), list of owned game instances, preferences
- **GameInstance**: id, gameId, ownership metadata (condition, purchase date, price), media references (cover URL, box images)
- **PokemonRecord**: id, gameInstanceId, pokedexNumber, status (seen/caught/shiny), party status
- **MediaAsset**: id, storageProvider (vercel-blob), url, checksum, ownerId, uploadedAt
- **CMSContent**: payload-managed document structures used for landing pages, guides, and curated lists

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A full production build and deploy to Vercel completes without critical runtime errors and serves the main application pages.
- **SC-002**: 100% of newly uploaded media during tests are stored in Vercel Blob and accessible via returned URLs.
- **SC-003**: Payload CMS content round-trip: editor creates/updates content and site renders changes within expected deploy time (no manual code deploy required for editorial content).
- **SC-004**: E2E smoke tests for core flows pass in CI (auth, add game, upload media, view Pokebox) with 0 critical failures.
- **SC-005**: Migration: a documented migration run can migrate a sample dataset (e.g., 100 users) with success metrics reported (migrated records, failed records) and retryability.

## Constitution Compliance (mandatory)

This feature touches the following constitution principles and will satisfy them as described:

- Data Safety & Privacy: Use secure, access-controlled Vercel Blob storage for media; encrypt sensitive environment variables; document retention and access control for migrated user data.
- Test-First: New/changed behavior will be accompanied by tests (unit, integration, E2E smoke) and added to CI before merge to main.
- Observability & Structured Logging: Add structured logs for media uploads, CMS publishes, migration runs, and auth errors; surface logs in CI and local debugging docs.
- Semantic Versioning & Migration: This change affects storage and data contracts; the spec requires a migration plan and compatibility tests. Expect at least a MINOR version bump for the app and a MAJOR bump only if we change external public contracts.

## Assumptions

- We will adopt Vercel Blob for media storage and Payload CMS (Postgres-backed) for editorial content as the primary systems as indicated by the supplied package.json.
- Supabase will act as a backup/fallback data store and optionally as an auth provider for migration — final decision required (see FR-004 clarification).
- Existing Firebase data may require export and transformation; full migration of all historical data is optional and gated behind the clarification in FR-004.
- The repository will be redeployed to Vercel and subject to Vercel limits (file size, bandwidth); large-file policies will be enforced.

## Out of Scope

- Replacing mobile/native clients that depend on Firebase realtime features (unless explicitly requested).
- Building a long-term multi-region replication strategy for Supabase beyond a tested failover.

``` 

# Phase 0 — Research

Goal: Resolve the open migration scope question (FR-004) and gather technical decisions for migrating media and CMS to Vercel Blob + Payload CMS with Supabase as fallback.

Decision (resolved): Selective migration of active users (Option B).

Rationale
- Full historical migration is high-effort and risky for an initial release. It requires thorough data validation, long-running jobs, and rollback capabilities.
- Selective migration of active users (e.g., users active in the last 12 months, or the top N by activity) achieves the primary product goal (active users retain continuity) while bounding effort and risk.
- On-demand migration (Option C) is lower effort but defers core continuity guarantees and complicates support. We will implement on-demand migration as a complementary tool for non-active users.

Selected policy
- Primary: Migrate media and profile history for users active in the last 12 months (configurable via MIGRATION_ACTIVE_WINDOW_MONTHS). Default: 12 months.
- Secondary: Provide an on-demand migration API and CLI for inactive users or for administrative backfills.

Open questions and mitigations
- Q: How to map Firebase Auth UIDs to Supabase / Payload user records?  
  A: Use UID mapping table during migration. If users are managed by Firebase Auth, export UID → email mapping and match by email when possible. For unmatched accounts, create placeholder user records and mark as "needs verification".

- Q: Media canonicalization — do we copy objects or rewrite references to proxied URLs?  
  A: Copy objects to Vercel Blob in a controlled batch (idempotent), update DB references to new blob URLs. Keep original Firebase references for 30 days as backup.

- Q: Payload CMS schema compatibility / content model mapping?  
  A: Create a Payload schema that models current entities (UserProfile, Team, GameInstance, MediaAsset). Map fields conservatively and add scripts to migrate and normalize fields. Keep legacy fields in a `legacyMetadata` JSON column during migration for audit.

Technical feasibility checks
- Vercel Blob integration: `@payloadcms/storage-vercel-blob` already exists and is compatible with Payload's storage adapter interface. Proof-of-concept: configure adapter with VERCEL_BLOB_TOKEN and a bucket/container mapping.
- Payload CMS: requires Postgres; will provision a managed Postgres for production (or use Supabase). Local dev can use Docker/Postgres or Supabase local dev.
- Supabase fallback: Supabase Postgres + storage can serve as fallback for media and as an auth provider. We'll implement a fallback logic in the upload layer: attempt Vercel Blob, on error write to Supabase storage and mark the asset record accordingly.

Risk assessment
- Migration jobs may run long and be throttled by upstream limits (Firebase export speed, Vercel Blob rate limits). Mitigation: rate-limited worker with resume/checkpointing, idempotent operations, and a test run on a sample set.
- Data loss risk: mitigate with staging environment runs, checksums, and keeping original data for N days.

Acceptance criteria for Phase 0
- Migration scope decision documented (this file).  
- Migration design: mapping documents for User, MediaAsset, GameInstance.  
- POC: small end-to-end transfer of 10 media files from Firebase to Vercel Blob and DB update.  
- Fallback: document Supabase fallback behavior and configuration.

Next steps (Phase 1 inputs)
1. Implement migration mapping scripts for selected scope (active users).  
2. Draft `data-model.md` reflecting the Payload schema and mapping rules.  
3. Draft API contracts for upload, publish, migration endpoints.  
4. Create quickstart for local dev including Payload + Postgres setup and Vercel Blob test config.

Prepared-by: automation (spec-authoring)
Date: 2025-10-29

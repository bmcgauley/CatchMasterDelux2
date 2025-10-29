# Phase 1 — Data Model

This document defines the primary entities, Payload CMS collections, and field mappings for migration from Firebase to Vercel Blob + Payload CMS (Postgres).

Design goals:
- Keep schema minimal and explicit.  
- Preserve legacy data in `legacyMetadata` for audit during the migration window.  
- Support efficient media lookup and URL rewrite.

Collections / Entities

1) users (Payload collection: `users`)
- id: uuid (primary)
- authUid: string (Firebase UID or Supabase UID) — indexed, unique when present
- email: string — indexed
- displayName: string
- avatar: relation -> mediaAssets (one) or string URL
- createdAt, updatedAt: timestamps
- lastActiveAt: timestamp (used for migration selection)
- legacyMetadata: JSON (freeform)

2) mediaAssets (Payload collection: `mediaAssets`)
- id: uuid
- filename: string
- mimeType: string
- size: integer
- storageProvider: enum {vercel_blob, supabase, firebase_legacy}
- providerUrl: string — canonical URL to fetch
- providerKey: string — storage key/path in provider
- uploadedBy: relation -> users
- uploadedAt: timestamp
- checksum: string (sha256)
- metadata: JSON (e.g., alt text, captions)
- legacyMetadata: JSON

3) gameInstances (Payload collection: `gameInstances`)
- id: uuid
- user: relation -> users
- gameId: string (from game catalog)
- state: JSON (game-specific state, save data)
- createdAt, updatedAt
- legacyMetadata: JSON

4) content (Payload collection for editorial content if needed)
- id, slug, title, body (markdown / rich text), images -> mediaAssets relation(s)

Mapping rules (Firebase -> Payload)
- Firebase user -> users: authUid maps to uid, email -> email, displayName -> displayName, lastActiveAt from lastLogin or activity logs.
- Firebase storage object -> mediaAssets: copy object to Vercel Blob at path `/migrations/{origBucket}/{objectPath}`, compute checksum, set storageProvider=vercel_blob and providerUrl to the Vercel Blob URL.
- Any extra fields stored in Firebase documents are serialized into legacyMetadata.

Indexes & Performance
- Index users.authUid, users.email, mediaAssets.providerKey.  
- Consider materialized view for commonly queried joins (e.g., user -> avatar) if queries become slow.

Validation rules
- Media file sizes: enforce max size (e.g., 50MB) on upload; migration should skip files over threshold and mark them for manual review.
- Required fields: mediaAssets.providerUrl, mediaAssets.storageProvider, users.email or authUid.

Migration considerations
- All migration jobs must be idempotent. Use providerKey + checksum to detect already-migrated assets.  
- Keep a migration log table with jobId, sourceRef, destRef, status, errorMessage, attemptCount.

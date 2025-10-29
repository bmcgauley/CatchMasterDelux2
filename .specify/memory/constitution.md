<!--
Sync Impact Report

- Version change: TEMPLATE -> 0.1.0
- Modified principles:
	- (new) "User Data Safety & Privacy" added
	- (new) "Test-First (NON-NEGOTIABLE)" added
	- (new) "Observability & Structured Logging" added
	- (new) "Semantic Versioning & Breaking Changes" added
	- (new) "Simplicity & Minimal Surface Area" added
- Added sections: Security & Compliance; Development Workflow & Quality Gates
- Removed sections: none
- Templates requiring updates:
	- .specify/templates/plan-template.md ✅ updated
	- .specify/templates/spec-template.md ✅ updated (added compliance note)
	- .specify/templates/tasks-template.md ✅ updated (added compliance note)
	- .specify/templates/commands/*.md ⚠ pending (directory not found)
- Follow-up TODOs:
	- TODO(RATIFICATION_DATE): confirm original ratification date; left as TODO pending project decision
	- Verify commands templates path exists and update any agent-specific names
 -->

# CatchMaster Delux Constitution

## Core Principles

### User Data Safety & Privacy
This project MUST treat user data (including game progress, account details, and any synced information) as a primary responsibility. All storage and transmission of personal or gameplay data MUST follow least-privilege access, encryption-in-transit, and Firestore best practices. Sensitive data fields MUST be identified and documented; any retention or deletion policy MUST be explicit.

Rationale: The platform stores personal game progress and account data in Firebase; protecting user data preserves trust and reduces risk.

### Test-First (NON-NEGOTIABLE)
All new features and bug fixes MUST be accompanied by automated tests that express the expected behavior before implementation. Tests SHOULD be written at the unit and contract level, with integration tests for cross-component behavior. Critical flows (auth, data persistence, backup/restore) MUST include regression tests.

Rationale: Ensures regressions are caught early and that shipped behavior is verifiable and maintainable.

### Observability & Structured Logging
Applications and services in this repository MUST emit structured logs for key operations (auth, data writes, sync operations, error paths). Logs MUST include correlation IDs where applicable and be human-readable for local dev but parseable for aggregation in production. Health checks and instrumentation endpoints SHOULD be provided for services where feasible.

Rationale: Observability shortens mean-time-to-detection and simplifies debugging for users' cross-game sync issues.

### Semantic Versioning & Breaking Changes
The project follows semantic versioning for public interfaces and APIs: MAJOR.MINOR.PATCH. MAJOR bumps are required for breaking changes to runtime contracts or public APIs. All breaking changes MUST include migration documentation and an automated compatibility test where practical.

Rationale: Clear versioning reduces integration friction for clients and other consumers of the codebase.

### Simplicity & Minimal Surface Area
Designers and implementers MUST prefer minimal, well-documented solutions. Features that significantly increase cognitive load, maintenance cost, or operational complexity require explicit justification in the plan stage and approval from maintainers.

Rationale: Keeps the codebase approachable and reduces long-term maintenance burden.

## Security & Compliance
This section captures non-functional constraints the project is REQUIRED to follow.

- Data handling: Encrypt sensitive fields in transit (TLS) and document sensitive field usage and retention. Follow Firebase rules to restrict read/write to authenticated and authorized users.
- Secrets: No secrets or private keys in repository. Use environment configuration and secret stores for deployment.
- Third-party APIs: Verify licensing and rate-limit usage. Cache responses to minimize external dependency exposure.

## Development Workflow & Quality Gates

- Pull Requests: Every PR MUST include a clear description, linked issue/spec, and specify the related principle(s) it touches (e.g., "Principles: Test-First, Observability").
- CI: All PRs MUST run automated tests. PRs that modify public contracts or data schemas MUST include migration steps and a compatibility plan.
- Reviews: At least one approving review from a maintainer is required for changes to core functionality; two approvals for breaking changes.

## Governance

Amendments: Changes to this constitution require a documented proposal in `.specify/` (PR with rationale and migration plan). Non-substantive wording fixes are PATCH-level changes. Adding a new principle or materially expanding an existing one is a MINOR bump. Removing or redefining a principle in a way that changes obligations is a MAJOR bump.

Approval: Amendments require approval by at least two maintainers or a maintainer + an appointed project steward. For MAJOR changes, the amendment MUST include a migration plan and a 7-day community comment window before merge.

Compliance Reviews: Projects and feature plans MUST include a "Constitution Check" section referencing which principles they affect and how they satisfy them. CI checks SHOULD surface missing tests, missing logging for critical flows, and schema migrations without migration scripts.

**Version**: 0.1.0 | **Ratified**: TODO(RATIFICATION_DATE): confirm adoption date | **Last Amended**: 2025-10-29


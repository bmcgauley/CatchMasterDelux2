# GitHub Issues Workflow Guide

## Overview

This project uses **GitHub Issues** managed via the **gh CLI** to track all tasks, following the workflow guardrails defined in [CLAUDE.md](../CLAUDE.md).

All tasks are organized by phases, milestones, user stories, and priorities to ensure systematic progress through the Vercel + Payload migration.

## Initial Setup

### 1. Install GitHub CLI (if not already installed)

```bash
# Windows (via winget)
winget install GitHub.cli

# macOS
brew install gh

# Linux
# See: https://github.com/cli/cli#installation
```

### 2. Authenticate with GitHub

```bash
gh auth login
```

### 3. Import Tasks from tasks.md

```bash
# Dry run first to preview what will be created
node scripts/import-tasks-to-github.js --dry-run

# Actually create the issues
node scripts/import-tasks-to-github.js
```

### 4. Load Helper Functions

**PowerShell (Windows):**
```powershell
. .\scripts\gh-workflow.ps1
```

**Bash (Linux/macOS):**
```bash
source scripts/gh-workflow.sh
```

## Project Organization

### Labels

#### Phase Labels
- `phase-1-setup` - Project initialization and configuration
- `phase-2-foundational` - Blocking prerequisites
- `phase-3-user-stories` - User story implementation
- `phase-final` - Polish & cross-cutting concerns

#### User Story Labels
- `us1-media-migration` - Migrate media storage to Vercel Blob (P1)
- `us2-payload-cms` - Integrate Payload CMS & assets (P1)
- `us3-supabase-fallback` - Configure Supabase fallback & auth (P2)
- `us4-ui-refresh` - UI refresh using shadcn & bug fixes (P2)

#### Priority Labels
- `priority-p` - Marked with [P] in original tasks (high priority)
- `priority-p1` - Critical tasks (must complete first)
- `priority-p2` - Important tasks (complete after P1)

### Milestones

1. **Phase 1: Setup** - Due: Nov 5, 2025
2. **Phase 2: Foundational** - Due: Nov 12, 2025
3. **Phase 3: User Stories** - Due: Nov 26, 2025
4. **Final Phase: Polish** - Due: Nov 30, 2025

## Daily Workflow

### 1. Check Project Status

```bash
# Overview of all phases
ghp

# Detailed status for current phase
ghs phase-1-setup
```

### 2. Find Next Task

```bash
# Show next available tasks
ghn

# Show P1 priority tasks
Get-PriorityTasks "priority-p1"  # PowerShell
gh-priority-tasks "priority-p1"   # Bash

# Show tasks for specific user story
Get-UserStoryTasks "us1-media-migration"  # PowerShell
gh-user-story "us1-media-migration"        # Bash
```

### 3. Start Working on a Task

```bash
# Assign task to yourself and view details
ghst 1

# Or manually:
gh issue view 1
gh issue edit 1 --add-assignee @me
```

### 4. Complete the Task

Following the **Workflow Guardrails** from CLAUDE.md:

```bash
# 1. Complete the implementation
# (write code, tests, etc.)

# 2. Stage changes
git add <files>

# 3. Close the issue with a commit reference
ghc 1 "Implemented in commit abc123"

# Or manually:
gh issue close 1 -c "Task completed - implemented X, Y, Z"

# 4. Check if at milestone
# If at a major milestone, create PR:
git commit -m "Complete T001-T006: Phase 1 setup

Implements initial project configuration including:
- Payload environment config
- npm scripts
- CI skeleton
- Migration config

Closes #1, #2, #3, #4, #5, #6

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Create PR at milestone
gh pr create --title "Phase 1: Setup Complete" \
  --body "$(cat <<'EOF'
## Summary
- Completed all Phase 1 setup tasks (T001-T006)
- Configured Payload environment
- Added npm scripts for dev workflow
- Created CI skeleton with security-audit gate
- Set up migration configuration

## Test plan
- [ ] Verify .env.payload.example has all required keys
- [ ] Run npm scripts: dev:payload, dev:client
- [ ] Check CI workflow runs successfully

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 5. Track Progress

```bash
# View your assigned tasks
ghm

# Daily summary
Get-DailySummary  # PowerShell
gh-daily-summary  # Bash

# View milestone progress
Get-MilestoneStatus 1  # PowerShell
gh-milestone-status 1  # Bash
```

## Common Commands Reference

### Quick Aliases

| Alias | PowerShell Function | Bash Function | Description |
|-------|---------------------|---------------|-------------|
| `ghp` | `Get-PhasesOverview` | `gh-phases-overview` | Show all phases overview |
| `ghs` | `Get-PhaseStatus` | `gh-phase-status` | Show phase status |
| `ghm` | `Get-MyTasks` | `gh-my-tasks` | Show my assigned tasks |
| `ghn` | `Get-NextTasks` | `gh-next-tasks` | Show next available tasks |
| `ghst` | `Start-Task` | `gh-start-task` | Start working on a task |
| `ghc` | `Complete-Task` | `gh-complete-task` | Complete a task |

### Native gh CLI Commands

```bash
# List all open issues
gh issue list

# List issues by label
gh issue list -l "phase-1-setup"

# List issues by milestone
gh issue list -m 1

# View issue details
gh issue view 1

# Edit issue
gh issue edit 1 --add-label "blocked" --add-assignee @me

# Close issue
gh issue close 1 -c "Completed"

# Reopen issue
gh issue reopen 1

# Search issues
gh issue list --search "payload config"

# Create new issue
gh issue create --title "New Task" --body "Description" -l "phase-1-setup" -m 1
```

## Workflow Guardrails (from CLAUDE.md)

**Strict pattern to follow:**

1. **Complete Task**: Finish current task completely
2. **Stage Changes**: Stage all related changes (`git add`)
3. **Mark Task Complete**: Close the GitHub issue
4. **Check Milestone**: Determine if at major milestone
5. **Create PR if Milestone**: If at milestone, create PR to master
6. **Move to Next Task**: Only after completing above steps

### Major Milestones

Major milestones include:
- Completion of a full phase (e.g., Phase 1: Foundation & Authentication)
- Implementation of a core feature (e.g., Game Collection Management complete)
- Significant architectural changes
- Ready for testing or review

## Branch Strategy

- **Feature Branches**: `feature/auth-system`, `feature/T001-T006-setup`
- **Phase Branches**: `phase-1-foundation`, `phase-2-user-stories`
- **Never commit directly to master**: All work through branches
- **PR to Master**: Only at major milestones or phase completions

## Task States

GitHub Issues provide built-in states:
- **Open**: Not yet started or in progress
- **Closed**: Completed

Additional state tracking via:
- **Assignees**: Assigned = in progress
- **Labels**: Can add `blocked`, `in-progress`, etc. if needed
- **Comments**: Document progress, blockers, notes

## Tips & Best Practices

### Issue References in Commits

Always reference issue numbers in commits:

```bash
git commit -m "Add Payload config

Implements .env.payload.example with all required keys:
- PAYLOAD_SECRET
- DATABASE_URL
- VERCEL_BLOB_TOKEN
- etc.

Closes #1"
```

### Linking Related Issues

```bash
# In issue comments, reference other issues
gh issue comment 15 -b "Blocked by #10 and #12"

# Link to commits
gh issue comment 15 -b "Implemented in abc1234"
```

### Bulk Operations

```bash
# Close multiple issues at once
gh issue close 1 2 3 4 5 6 -c "Phase 1 complete"

# Add label to multiple issues
for i in {1..6}; do
  gh issue edit $i --add-label "phase-1-setup"
done
```

### Custom Queries

```bash
# Find unassigned P1 tasks
gh issue list -l "priority-p1" --json number,title,assignees | \
  jq -r '.[] | select(.assignees | length == 0) | "#\(.number): \(.title)"'

# Find tasks with specific file path
gh issue list --search "payload/config" --json number,title,body
```

## Troubleshooting

### Can't find gh command

Ensure gh CLI is installed and in PATH:
```bash
gh --version
```

### Authentication issues

Re-authenticate:
```bash
gh auth logout
gh auth login
```

### Import script fails

Check that you're in the project root and tasks.md exists:
```bash
ls specs/001-vercel-payload-migration/tasks.md
```

Run with Node.js directly:
```bash
node scripts/import-tasks-to-github.js --dry-run
```

## Resources

- [GitHub CLI Manual](https://cli.github.com/manual/)
- [gh issue documentation](https://cli.github.com/manual/gh_issue)
- [Project Tasks](../specs/001-vercel-payload-migration/tasks.md)
- [Project Instructions](../CLAUDE.md)

---

**Remember**: This workflow ensures systematic progress through the migration while maintaining clear tracking of all tasks. Follow the guardrails and document your progress at each step.

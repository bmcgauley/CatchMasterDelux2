# GitHub CLI Quick Reference Card

## Setup (One-time)

```bash
# Import all tasks
node scripts/import-tasks-to-github.js

# Load helpers (PowerShell)
. .\scripts\gh-workflow.ps1

# Load helpers (Bash)
source scripts/gh-workflow.sh
```

## Daily Commands

```bash
# Check overall progress
ghp

# See next tasks to do
ghn

# See my current tasks
ghm

# Start task #5
ghst 5

# Complete task #5
ghc 5 "Task completed"
```

## Workflow Pattern

```
1. Find task:     ghn or ghm
2. Start task:    ghst <number>
3. Do work:       <code, test, document>
4. Stage:         git add <files>
5. Complete:      ghc <number> "Done"
6. Check phase:   ghs phase-1-setup
7. At milestone?  Create PR to master
8. Repeat
```

## Essential gh Commands

```bash
# List
gh issue list                          # All open issues
gh issue list -l phase-1-setup        # By label
gh issue list -m 1                    # By milestone
gh issue list -a @me                  # Assigned to me

# View
gh issue view 1                       # View issue details

# Edit
gh issue edit 1 --add-assignee @me   # Assign to self
gh issue edit 1 --add-label blocked  # Add label

# Close/Reopen
gh issue close 1 -c "Done"           # Close with comment
gh issue reopen 1                    # Reopen

# Search
gh issue list --search "payload"     # Search by keyword
```

## Helper Functions

### PowerShell

```powershell
Get-PhasesOverview              # All phases status
Get-PhaseStatus "phase-1-setup" # One phase status
Get-MyTasks                     # My assigned tasks
Get-NextTasks                   # Next available tasks
Get-PriorityTasks "priority-p1" # P1 tasks
Get-UserStoryTasks "us1-media-migration" # By user story
Start-Task 1                    # Start task
Complete-Task 1 "Done"          # Complete task
Get-DailySummary               # Today's summary
```

### Bash

```bash
gh-phases-overview              # All phases status
gh-phase-status phase-1-setup   # One phase status
gh-my-tasks                     # My assigned tasks
gh-next-tasks                   # Next available tasks
gh-priority-tasks priority-p1   # P1 tasks
gh-user-story us1-media-migration # By user story
gh-start-task 1                 # Start task
gh-complete-task 1 "Done"       # Complete task
gh-daily-summary               # Today's summary
```

## Labels

- `phase-1-setup` - Setup tasks
- `phase-2-foundational` - Foundation tasks
- `phase-3-user-stories` - User stories
- `phase-final` - Polish tasks
- `us1-media-migration` - Media migration (P1)
- `us2-payload-cms` - Payload CMS (P1)
- `us3-supabase-fallback` - Supabase fallback (P2)
- `us4-ui-refresh` - UI refresh (P2)
- `priority-p1` - Critical
- `priority-p2` - Important
- `priority-p` - High priority [P] tasks

## Milestones

1. Phase 1: Setup (Due: Nov 5)
2. Phase 2: Foundational (Due: Nov 12)
3. Phase 3: User Stories (Due: Nov 26)
4. Final Phase: Polish (Due: Nov 30)

## Commit Message Format

```
<Short description>

<Detailed explanation>

Closes #<issue-number>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## PR at Milestones

When completing a phase or major milestone:

```bash
git commit -m "Complete Phase 1: Setup

Implemented all setup tasks:
- T001: Payload env config
- T002: Payload package.json
- T003: NPM scripts
- T004: Migration config
- T005: CI skeleton
- T006: Migration defaults

Closes #1, #2, #3, #4, #5, #6

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

gh pr create --title "Phase 1: Setup Complete" \
  --body "Summary of changes..."
```

## Common Queries

```bash
# Unassigned P1 tasks
gh issue list -l priority-p1 --json number,title,assignees | \
  jq '.[] | select(.assignees|length==0)'

# Tasks in Phase 1
gh issue list -l phase-1-setup

# Blocked tasks
gh issue list -l blocked

# My open tasks
gh issue list -a @me --state open

# Recently closed
gh issue list --state closed --search "closed:today"
```

## Tips

- Always reference issue numbers in commits
- Close issues only when fully complete
- Create PRs only at major milestones
- Use `--dry-run` when testing scripts
- Check phase status before moving to next task
- Document blockers in issue comments

---

**Full docs:** [docs/github-workflow.md](./github-workflow.md)

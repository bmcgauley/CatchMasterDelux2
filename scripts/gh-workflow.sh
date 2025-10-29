#!/bin/bash
# GitHub Issues Workflow Helper Scripts
# Usage: source scripts/gh-workflow.sh

# === Status Checking ===

# Show current phase progress
gh-phase-status() {
  local phase="${1:-phase-1-setup}"
  echo "📊 Status for $phase:"
  echo ""
  gh issue list -l "$phase" --json number,title,state,labels | \
    jq -r '.[] | "\(.state | ascii_upcase): #\(.number) - \(.title)"'
}

# Show all phases overview
gh-phases-overview() {
  echo "📈 Project Overview - All Phases"
  echo "================================"
  for phase in "phase-1-setup" "phase-2-foundational" "phase-3-user-stories" "phase-final"; do
    local total=$(gh issue list -l "$phase" --json number | jq '. | length')
    local open=$(gh issue list -l "$phase" --state open --json number | jq '. | length')
    local closed=$(gh issue list -l "$phase" --state closed --json number | jq '. | length')
    echo "$phase: $closed/$total completed ($open open)"
  done
  echo ""
}

# Show current milestone progress
gh-milestone-status() {
  local milestone="${1:-1}"
  echo "🎯 Milestone $milestone Progress:"
  echo ""
  gh issue list -m "$milestone" --json number,title,state | \
    jq -r '.[] | "\(.state | ascii_upcase): #\(.number) - \(.title)"'
}

# === Task Management ===

# Start working on a task (assign to self, add in-progress label if you have one)
gh-start-task() {
  local issue_num="$1"
  if [ -z "$issue_num" ]; then
    echo "Usage: gh-start-task <issue-number>"
    return 1
  fi
  gh issue edit "$issue_num" --add-assignee @me
  echo "✓ Started working on #$issue_num"
  gh issue view "$issue_num"
}

# Complete a task (close issue with comment)
gh-complete-task() {
  local issue_num="$1"
  local comment="${2:-Task completed}"
  if [ -z "$issue_num" ]; then
    echo "Usage: gh-complete-task <issue-number> [comment]"
    return 1
  fi
  gh issue close "$issue_num" -c "$comment"
  echo "✅ Completed #$issue_num"
}

# List my current tasks
gh-my-tasks() {
  echo "📋 Your Assigned Tasks:"
  echo ""
  gh issue list --assignee @me --json number,title,labels | \
    jq -r '.[] | "#\(.number): \(.title)\n  Labels: \(.labels | map(.name) | join(", "))\n"'
}

# List tasks by priority
gh-priority-tasks() {
  local priority="${1:-priority-p1}"
  echo "🔥 Tasks with $priority:"
  echo ""
  gh issue list -l "$priority" --state open --json number,title,labels | \
    jq -r '.[] | "#\(.number): \(.title)"'
}

# === Search & Filter ===

# Find tasks by user story
gh-user-story() {
  local us="${1:-us1-media-migration}"
  echo "📖 Tasks for $us:"
  echo ""
  gh issue list -l "$us" --json number,title,state | \
    jq -r '.[] | "\(.state | ascii_upcase): #\(.number) - \(.title)"'
}

# Search tasks by keyword
gh-search-tasks() {
  local keyword="$1"
  if [ -z "$keyword" ]; then
    echo "Usage: gh-search-tasks <keyword>"
    return 1
  fi
  echo "🔍 Searching for: $keyword"
  echo ""
  gh issue list --search "$keyword" --json number,title,state | \
    jq -r '.[] | "#\(.number): \(.title) [\(.state)]"'
}

# === Quick Views ===

# Show next available tasks to work on
gh-next-tasks() {
  echo "▶️  Next Available Tasks (Phase 1, not assigned):"
  echo ""
  gh issue list -l "phase-1-setup" --state open --json number,title,assignees | \
    jq -r '.[] | select(.assignees | length == 0) | "#\(.number): \(.title)"' | head -5
}

# Show blocked or problematic tasks (you'd need a 'blocked' label)
gh-blocked-tasks() {
  echo "🚧 Blocked Tasks:"
  echo ""
  gh issue list -l "blocked" --state open --json number,title | \
    jq -r '.[] | "#\(.number): \(.title)"'
}

# === Reporting ===

# Generate daily summary
gh-daily-summary() {
  local date="${1:-today}"
  echo "📅 Daily Summary for $date"
  echo "========================="
  echo ""
  echo "✅ Closed today:"
  gh issue list --state closed --search "closed:$date" --json number,title | \
    jq -r '.[] | "  #\(.number): \(.title)"'
  echo ""
  echo "📝 Currently assigned to you:"
  gh issue list --assignee @me --state open --json number,title | \
    jq -r '.[] | "  #\(.number): \(.title)"'
  echo ""
}

# === Aliases for common commands ===
alias ghs='gh-phase-status'
alias ghp='gh-phases-overview'
alias ghm='gh-my-tasks'
alias ghn='gh-next-tasks'
alias ghst='gh-start-task'
alias ghc='gh-complete-task'

echo "✨ GitHub Workflow helpers loaded!"
echo ""
echo "Common commands:"
echo "  ghp              - Show all phases overview"
echo "  ghs <phase>      - Show phase status"
echo "  ghm              - Show my tasks"
echo "  ghn              - Show next available tasks"
echo "  ghst <number>    - Start working on a task"
echo "  ghc <number>     - Complete a task"
echo ""
echo "Type 'gh-' and press TAB to see all available commands"

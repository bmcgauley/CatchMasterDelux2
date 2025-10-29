# GitHub Issues Workflow Helper Scripts (PowerShell)
# Usage: . .\scripts\gh-workflow.ps1

# === Status Checking ===

function Get-PhaseStatus {
    param(
        [string]$Phase = "phase-1-setup"
    )
    Write-Host "📊 Status for $Phase:" -ForegroundColor Cyan
    Write-Host ""
    gh issue list -l $Phase --json number,title,state,labels | ConvertFrom-Json | ForEach-Object {
        $state = $_.state.ToUpper()
        Write-Host "$state : #$($_.number) - $($_.title)"
    }
}

function Get-PhasesOverview {
    Write-Host "📈 Project Overview - All Phases" -ForegroundColor Cyan
    Write-Host "================================"
    $phases = @("phase-1-setup", "phase-2-foundational", "phase-3-user-stories", "phase-final")
    foreach ($phase in $phases) {
        $total = (gh issue list -l $phase --json number | ConvertFrom-Json).Count
        $open = (gh issue list -l $phase --state open --json number | ConvertFrom-Json).Count
        $closed = (gh issue list -l $phase --state closed --json number | ConvertFrom-Json).Count
        Write-Host "$phase : $closed/$total completed ($open open)"
    }
    Write-Host ""
}

function Get-MilestoneStatus {
    param(
        [int]$Milestone = 1
    )
    Write-Host "🎯 Milestone $Milestone Progress:" -ForegroundColor Cyan
    Write-Host ""
    gh issue list -m $Milestone --json number,title,state | ConvertFrom-Json | ForEach-Object {
        $state = $_.state.ToUpper()
        Write-Host "$state : #$($_.number) - $($_.title)"
    }
}

# === Task Management ===

function Start-Task {
    param(
        [Parameter(Mandatory=$true)]
        [int]$IssueNumber
    )
    gh issue edit $IssueNumber --add-assignee @me
    Write-Host "✓ Started working on #$IssueNumber" -ForegroundColor Green
    gh issue view $IssueNumber
}

function Complete-Task {
    param(
        [Parameter(Mandatory=$true)]
        [int]$IssueNumber,
        [string]$Comment = "Task completed"
    )
    gh issue close $IssueNumber -c $Comment
    Write-Host "✅ Completed #$IssueNumber" -ForegroundColor Green
}

function Get-MyTasks {
    Write-Host "📋 Your Assigned Tasks:" -ForegroundColor Cyan
    Write-Host ""
    gh issue list --assignee @me --json number,title,labels | ConvertFrom-Json | ForEach-Object {
        Write-Host "#$($_.number): $($_.title)" -ForegroundColor Yellow
        $labelNames = $_.labels | ForEach-Object { $_.name }
        Write-Host "  Labels: $($labelNames -join ', ')" -ForegroundColor Gray
        Write-Host ""
    }
}

function Get-PriorityTasks {
    param(
        [string]$Priority = "priority-p1"
    )
    Write-Host "🔥 Tasks with $Priority :" -ForegroundColor Cyan
    Write-Host ""
    gh issue list -l $Priority --state open --json number,title | ConvertFrom-Json | ForEach-Object {
        Write-Host "#$($_.number): $($_.title)"
    }
}

# === Search & Filter ===

function Get-UserStoryTasks {
    param(
        [string]$UserStory = "us1-media-migration"
    )
    Write-Host "📖 Tasks for $UserStory :" -ForegroundColor Cyan
    Write-Host ""
    gh issue list -l $UserStory --json number,title,state | ConvertFrom-Json | ForEach-Object {
        $state = $_.state.ToUpper()
        Write-Host "$state : #$($_.number) - $($_.title)"
    }
}

function Search-Tasks {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Keyword
    )
    Write-Host "🔍 Searching for: $Keyword" -ForegroundColor Cyan
    Write-Host ""
    gh issue list --search $Keyword --json number,title,state | ConvertFrom-Json | ForEach-Object {
        Write-Host "#$($_.number): $($_.title) [$($_.state)]"
    }
}

# === Quick Views ===

function Get-NextTasks {
    Write-Host "▶️  Next Available Tasks (Phase 1, not assigned):" -ForegroundColor Cyan
    Write-Host ""
    gh issue list -l "phase-1-setup" --state open --json number,title,assignees | ConvertFrom-Json |
        Where-Object { $_.assignees.Count -eq 0 } |
        Select-Object -First 5 |
        ForEach-Object {
            Write-Host "#$($_.number): $($_.title)"
        }
}

function Get-BlockedTasks {
    Write-Host "🚧 Blocked Tasks:" -ForegroundColor Cyan
    Write-Host ""
    gh issue list -l "blocked" --state open --json number,title | ConvertFrom-Json | ForEach-Object {
        Write-Host "#$($_.number): $($_.title)"
    }
}

# === Reporting ===

function Get-DailySummary {
    param(
        [string]$Date = "today"
    )
    Write-Host "📅 Daily Summary for $Date" -ForegroundColor Cyan
    Write-Host "========================="
    Write-Host ""
    Write-Host "✅ Closed today:" -ForegroundColor Green
    gh issue list --state closed --search "closed:$Date" --json number,title | ConvertFrom-Json | ForEach-Object {
        Write-Host "  #$($_.number): $($_.title)"
    }
    Write-Host ""
    Write-Host "📝 Currently assigned to you:" -ForegroundColor Yellow
    gh issue list --assignee @me --state open --json number,title | ConvertFrom-Json | ForEach-Object {
        Write-Host "  #$($_.number): $($_.title)"
    }
    Write-Host ""
}

# === Aliases ===
Set-Alias -Name ghs -Value Get-PhaseStatus
Set-Alias -Name ghp -Value Get-PhasesOverview
Set-Alias -Name ghm -Value Get-MyTasks
Set-Alias -Name ghn -Value Get-NextTasks
Set-Alias -Name ghst -Value Start-Task
Set-Alias -Name ghc -Value Complete-Task

Write-Host "✨ GitHub Workflow helpers loaded!" -ForegroundColor Green
Write-Host ""
Write-Host "Common commands:"
Write-Host "  ghp              - Show all phases overview"
Write-Host "  ghs <phase>      - Show phase status"
Write-Host "  ghm              - Show my tasks"
Write-Host "  ghn              - Show next available tasks"
Write-Host "  ghst <number>    - Start working on a task"
Write-Host "  ghc <number>     - Complete a task"
Write-Host ""
Write-Host "For full function names, use Get-Command *-*Task*" -ForegroundColor Gray

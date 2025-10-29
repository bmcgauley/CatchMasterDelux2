#!/usr/bin/env node
/**
 * Import tasks from tasks.md to GitHub Issues
 * Usage: node scripts/import-tasks-to-github.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DRY_RUN = process.argv.includes('--dry-run');
const TASKS_FILE = path.join(__dirname, '../specs/001-vercel-payload-migration/tasks.md');

// Parse tasks.md file
function parseTasks(content) {
  const lines = content.split('\n');
  const tasks = [];
  let currentPhase = null;
  let currentUserStory = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect phase headers
    if (line.startsWith('Phase 1')) currentPhase = 'phase-1-setup';
    else if (line.startsWith('Phase 2')) currentPhase = 'phase-2-foundational';
    else if (line.startsWith('Phase 3') || line.startsWith('US')) currentPhase = 'phase-3-user-stories';
    else if (line.startsWith('Final Phase')) currentPhase = 'phase-final';

    // Detect user story sections
    if (line.startsWith('US1')) currentUserStory = 'us1-media-migration';
    else if (line.startsWith('US2')) currentUserStory = 'us2-payload-cms';
    else if (line.startsWith('US3')) currentUserStory = 'us3-supabase-fallback';
    else if (line.startsWith('US4')) currentUserStory = 'us4-ui-refresh';

    // Parse task lines
    const taskMatch = line.match(/^- \[ \] (T\d+)(.*)/);
    if (taskMatch) {
      const taskId = taskMatch[1];
      const rest = taskMatch[2].trim();

      // Extract markers [P] and [USn]
      const hasPriority = rest.includes('[P]');
      const usMatch = rest.match(/\[US(\d+)\]/);

      // Remove markers to get clean description
      let description = rest
        .replace(/\[P\]/g, '')
        .replace(/\[US\d+\]/g, '')
        .trim();

      // Extract file path if present
      const filePathMatch = description.match(/(?:File path:|at)\s+`([^`]+)`/);
      const filePaths = [];
      if (filePathMatch) {
        filePaths.push(filePathMatch[1]);
      }
      // Also capture inline file mentions
      const inlineFiles = [...description.matchAll(/`([^`]+\.(js|ts|tsx|jsx|json|md|sql|yml))`/g)];
      inlineFiles.forEach(match => {
        if (!filePaths.includes(match[1])) {
          filePaths.push(match[1]);
        }
      });

      tasks.push({
        id: taskId,
        title: `${taskId}: ${description.substring(0, 80)}${description.length > 80 ? '...' : ''}`,
        body: description,
        labels: getLabels(currentPhase, currentUserStory, hasPriority, usMatch),
        milestone: getMilestone(currentPhase),
        filePaths
      });
    }
  }

  return tasks;
}

function getLabels(phase, userStory, hasPriority, usMatch) {
  const labels = [];

  if (phase) labels.push(phase);
  if (userStory) labels.push(userStory);
  if (hasPriority) labels.push('priority-p');

  // Add priority based on user story
  if (userStory === 'us1-media-migration' || userStory === 'us2-payload-cms') {
    labels.push('priority-p1');
  } else if (userStory === 'us3-supabase-fallback' || userStory === 'us4-ui-refresh') {
    labels.push('priority-p2');
  }

  return labels;
}

function getMilestone(phase) {
  const milestoneMap = {
    'phase-1-setup': 1,
    'phase-2-foundational': 2,
    'phase-3-user-stories': 3,
    'phase-final': 4
  };
  return milestoneMap[phase] || null;
}

function createIssue(task) {
  const labelArgs = task.labels.map(l => `-l "${l}"`).join(' ');
  const milestoneArg = task.milestone ? `-m ${task.milestone}` : '';

  let body = task.body;
  if (task.filePaths.length > 0) {
    body += '\n\n**Files:**\n' + task.filePaths.map(f => `- \`${f}\``).join('\n');
  }

  // Escape quotes in body
  body = body.replace(/"/g, '\\"');

  const cmd = `gh issue create --title "${task.title}" --body "${body}" ${labelArgs} ${milestoneArg}`;

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would create: ${task.title}`);
    console.log(`  Labels: ${task.labels.join(', ')}`);
    console.log(`  Milestone: ${task.milestone || 'None'}`);
    console.log('');
  } else {
    try {
      const result = execSync(cmd, { encoding: 'utf-8' });
      console.log(`✓ Created: ${task.title}`);
      console.log(`  ${result.trim()}`);
    } catch (error) {
      console.error(`✗ Failed to create: ${task.title}`);
      console.error(`  Error: ${error.message}`);
    }
  }
}

// Main execution
function main() {
  console.log('Reading tasks from:', TASKS_FILE);
  console.log('Mode:', DRY_RUN ? 'DRY RUN' : 'LIVE');
  console.log('');

  const content = fs.readFileSync(TASKS_FILE, 'utf-8');
  const tasks = parseTasks(content);

  console.log(`Found ${tasks.length} tasks to import\n`);

  tasks.forEach(task => {
    createIssue(task);
  });

  console.log('\nDone!');
  if (DRY_RUN) {
    console.log('\nRun without --dry-run to actually create issues:');
    console.log('  node scripts/import-tasks-to-github.js');
  }
}

main();

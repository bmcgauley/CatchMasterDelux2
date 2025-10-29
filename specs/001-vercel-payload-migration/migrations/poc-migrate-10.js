#!/usr/bin/env node

/**
 * POC Migration Script - Migrate 10 Sample Records
 *
 * Proof-of-concept migration that processes a small sample dataset from Firebase
 * and migrates it to Vercel Blob + Payload CMS (Postgres).
 *
 * Features:
 * - Reads sample Firebase export from JSON file
 * - Maps Firebase data to Payload collections using mapping functions
 * - Simulates Vercel Blob uploads with checksums
 * - Tracks migration progress and generates detailed report
 * - Supports --dry-run flag for testing
 *
 * Usage:
 *   node poc-migrate-10.js [--dry-run]
 *
 * Output:
 *   specs/001-vercel-payload-migration/migrations/poc-report.json
 *
 * Related: T016 - POC migration script
 * Created: 2025-10-29
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import mapping functions
const {
  mapUserToPayload,
  mapMediaToPayload,
  mapGameInstanceToPayload,
  generateMigrationPath,
  validateMigratedData,
} = require('./mapping/firebase-to-payload');

// Parse command-line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// File paths
const SAMPLE_EXPORT_PATH = path.join(__dirname, 'sample-firebase-export.json');
const REPORT_OUTPUT_PATH = path.join(__dirname, 'poc-report.json');

/**
 * Main migration function
 */
async function runPocMigration() {
  console.log('='.repeat(80));
  console.log('POC Migration: Firebase to Vercel Blob + Payload CMS');
  console.log('='.repeat(80));
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Source: ${SAMPLE_EXPORT_PATH}`);
  console.log(`Report: ${REPORT_OUTPUT_PATH}`);
  console.log('='.repeat(80));
  console.log('');

  // Initialize report
  const report = {
    metadata: {
      startedAt: new Date().toISOString(),
      mode: isDryRun ? 'dry-run' : 'live',
      sourceFile: SAMPLE_EXPORT_PATH,
    },
    summary: {
      users: { total: 0, succeeded: 0, failed: 0 },
      media: { total: 0, succeeded: 0, failed: 0 },
      gameInstances: { total: 0, succeeded: 0, failed: 0 },
    },
    details: {
      users: [],
      media: [],
      gameInstances: [],
    },
    errors: [],
  };

  try {
    // Step 1: Read Firebase export
    console.log('[Step 1/4] Reading Firebase export...');
    const firebaseData = readFirebaseExport();
    console.log(`✓ Loaded ${firebaseData.users.length} users, ${firebaseData.storageObjects.length} media objects, ${firebaseData.gameInstances.length} game instances`);
    console.log('');

    // Step 2: Migrate users
    console.log('[Step 2/4] Migrating users...');
    const userIdMap = await migrateUsers(firebaseData.users, report);
    console.log(`✓ Migrated ${report.summary.users.succeeded}/${report.summary.users.total} users`);
    console.log('');

    // Step 3: Migrate media assets
    console.log('[Step 3/4] Migrating media assets...');
    await migrateMediaAssets(firebaseData.storageObjects, userIdMap, report);
    console.log(`✓ Migrated ${report.summary.media.succeeded}/${report.summary.media.total} media assets`);
    console.log('');

    // Step 4: Migrate game instances
    console.log('[Step 4/4] Migrating game instances...');
    await migrateGameInstances(firebaseData.gameInstances, userIdMap, report);
    console.log(`✓ Migrated ${report.summary.gameInstances.succeeded}/${report.summary.gameInstances.total} game instances`);
    console.log('');

    // Finalize report
    report.metadata.completedAt = new Date().toISOString();
    report.metadata.durationMs = new Date(report.metadata.completedAt) - new Date(report.metadata.startedAt);

    // Write report
    writeReport(report);

    // Print summary
    printSummary(report);

    console.log('');
    console.log('='.repeat(80));
    console.log('✓ Migration completed successfully!');
    console.log(`Report saved to: ${REPORT_OUTPUT_PATH}`);
    console.log('='.repeat(80));

    return report;
  } catch (error) {
    console.error('');
    console.error('='.repeat(80));
    console.error('✗ Migration failed!');
    console.error(error.message);
    console.error('='.repeat(80));

    report.metadata.completedAt = new Date().toISOString();
    report.metadata.error = error.message;
    report.metadata.errorStack = error.stack;

    writeReport(report);
    throw error;
  }
}

/**
 * Read and parse Firebase export JSON file
 */
function readFirebaseExport() {
  try {
    const rawData = fs.readFileSync(SAMPLE_EXPORT_PATH, 'utf8');
    const data = JSON.parse(rawData);

    // Validate structure
    if (!data.users || !data.storageObjects || !data.gameInstances) {
      throw new Error('Invalid Firebase export format: missing required collections');
    }

    return data;
  } catch (error) {
    throw new Error(`Failed to read Firebase export: ${error.message}`);
  }
}

/**
 * Migrate users from Firebase to Payload
 */
async function migrateUsers(firebaseUsers, report) {
  const userIdMap = new Map(); // Map Firebase UID -> Payload user ID

  report.summary.users.total = firebaseUsers.length;

  for (const firebaseUser of firebaseUsers) {
    try {
      console.log(`  • Migrating user: ${firebaseUser.email}`);

      // Map to Payload format
      const payloadUser = mapUserToPayload(firebaseUser);

      // Validate
      validateMigratedData(payloadUser, 'user');

      // Generate Payload user ID (simulate UUID)
      const payloadUserId = generateUuid();

      // Store mapping
      userIdMap.set(firebaseUser.uid, payloadUserId);

      // Record details
      report.details.users.push({
        firebaseUid: firebaseUser.uid,
        payloadUserId,
        email: payloadUser.email,
        displayName: payloadUser.displayName,
        status: 'success',
      });

      report.summary.users.succeeded++;

      if (!isDryRun) {
        // TODO: Insert into Payload users collection via API
        // await payload.create({ collection: 'users', data: payloadUser });
      }
    } catch (error) {
      console.error(`    ✗ Failed: ${error.message}`);
      report.summary.users.failed++;
      report.errors.push({
        type: 'user',
        firebaseUid: firebaseUser.uid,
        error: error.message,
      });
      report.details.users.push({
        firebaseUid: firebaseUser.uid,
        status: 'failed',
        error: error.message,
      });
    }
  }

  return userIdMap;
}

/**
 * Migrate media assets from Firebase Storage to Vercel Blob
 */
async function migrateMediaAssets(storageObjects, userIdMap, report) {
  report.summary.media.total = storageObjects.length;

  for (const storageObject of storageObjects) {
    try {
      console.log(`  • Migrating media: ${storageObject.name}`);

      // Determine uploader
      const firebaseUploaderId = storageObject.metadata?.uploadedBy;
      const payloadUserId = userIdMap.get(firebaseUploaderId) || null;

      // Generate migration path
      const migrationPath = generateMigrationPath(storageObject.bucket, storageObject.name);

      // Simulate Vercel Blob upload
      const vercelBlobInfo = simulateVercelBlobUpload(migrationPath, storageObject);

      // Map to Payload format
      const payloadMedia = mapMediaToPayload(storageObject, vercelBlobInfo, payloadUserId);

      // Validate
      validateMigratedData(payloadMedia, 'media');

      // Generate Payload media ID
      const payloadMediaId = generateUuid();

      // Record details
      report.details.media.push({
        payloadMediaId,
        filename: payloadMedia.filename,
        firebasePath: storageObject.name,
        vercelBlobUrl: vercelBlobInfo.url,
        providerKey: payloadMedia.providerKey,
        checksum: payloadMedia.checksum,
        size: payloadMedia.size,
        mimeType: payloadMedia.mimeType,
        uploadedBy: payloadUserId,
        status: 'success',
      });

      report.summary.media.succeeded++;

      if (!isDryRun) {
        // TODO: Upload to Vercel Blob and insert into Payload mediaAssets collection
        // const blob = await uploadToVercelBlob(storageObject);
        // await payload.create({ collection: 'mediaAssets', data: payloadMedia });
      }
    } catch (error) {
      console.error(`    ✗ Failed: ${error.message}`);
      report.summary.media.failed++;
      report.errors.push({
        type: 'media',
        firebasePath: storageObject.name,
        error: error.message,
      });
      report.details.media.push({
        filename: storageObject.name,
        status: 'failed',
        error: error.message,
      });
    }
  }
}

/**
 * Migrate game instances from Firebase to Payload
 */
async function migrateGameInstances(gameInstances, userIdMap, report) {
  report.summary.gameInstances.total = gameInstances.length;

  for (const gameInstance of gameInstances) {
    try {
      console.log(`  • Migrating game instance: ${gameInstance.gameId} (${gameInstance.id})`);

      // Get mapped user ID
      const payloadUserId = userIdMap.get(gameInstance.userId);
      if (!payloadUserId) {
        throw new Error(`User not found: ${gameInstance.userId}`);
      }

      // Map to Payload format
      const payloadGame = mapGameInstanceToPayload(gameInstance, payloadUserId);

      // Validate
      validateMigratedData(payloadGame, 'gameInstance');

      // Generate Payload game instance ID
      const payloadGameId = generateUuid();

      // Record details
      report.details.gameInstances.push({
        payloadGameId,
        firebaseDocId: gameInstance.id,
        gameId: gameInstance.gameId,
        userId: payloadUserId,
        status: 'success',
      });

      report.summary.gameInstances.succeeded++;

      if (!isDryRun) {
        // TODO: Insert into Payload gameInstances collection
        // await payload.create({ collection: 'gameInstances', data: payloadGame });
      }
    } catch (error) {
      console.error(`    ✗ Failed: ${error.message}`);
      report.summary.gameInstances.failed++;
      report.errors.push({
        type: 'gameInstance',
        firebaseDocId: gameInstance.id,
        error: error.message,
      });
      report.details.gameInstances.push({
        firebaseDocId: gameInstance.id,
        status: 'failed',
        error: error.message,
      });
    }
  }
}

/**
 * Simulate Vercel Blob upload (returns mock blob info)
 */
function simulateVercelBlobUpload(pathname, storageObject) {
  // Generate a mock Vercel Blob URL
  const mockBlobUrl = `https://abc123xyz.public.blob.vercel-storage.com/${pathname}`;

  return {
    url: mockBlobUrl,
    pathname: pathname,
  };
}

/**
 * Generate UUID v4 (simplified)
 */
function generateUuid() {
  return crypto.randomUUID();
}

/**
 * Write migration report to JSON file
 */
function writeReport(report) {
  try {
    fs.writeFileSync(REPORT_OUTPUT_PATH, JSON.stringify(report, null, 2), 'utf8');
  } catch (error) {
    console.error(`Failed to write report: ${error.message}`);
  }
}

/**
 * Print migration summary to console
 */
function printSummary(report) {
  console.log('');
  console.log('-'.repeat(80));
  console.log('Migration Summary');
  console.log('-'.repeat(80));
  console.log(`Duration: ${report.metadata.durationMs}ms`);
  console.log('');
  console.log('Users:');
  console.log(`  Total:     ${report.summary.users.total}`);
  console.log(`  Succeeded: ${report.summary.users.succeeded}`);
  console.log(`  Failed:    ${report.summary.users.failed}`);
  console.log('');
  console.log('Media Assets:');
  console.log(`  Total:     ${report.summary.media.total}`);
  console.log(`  Succeeded: ${report.summary.media.succeeded}`);
  console.log(`  Failed:    ${report.summary.media.failed}`);
  console.log('');
  console.log('Game Instances:');
  console.log(`  Total:     ${report.summary.gameInstances.total}`);
  console.log(`  Succeeded: ${report.summary.gameInstances.succeeded}`);
  console.log(`  Failed:    ${report.summary.gameInstances.failed}`);
  console.log('');
  if (report.errors.length > 0) {
    console.log('Errors:');
    report.errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. [${err.type}] ${err.error}`);
    });
  }
  console.log('-'.repeat(80));
}

// Run migration if executed directly
if (require.main === module) {
  runPocMigration()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runPocMigration };

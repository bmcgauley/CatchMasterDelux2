/**
 * Integration Test for POC Migration
 *
 * Tests the end-to-end POC migration process by running the migration script
 * in dry-run mode and validating the generated report.
 *
 * Test validates:
 * - POC migration script executes successfully
 * - Report file is generated at expected location
 * - Report contains expected structure and data
 * - Zero critical failures in migration
 * - All records are successfully processed
 *
 * Related: T019 - Integration test for migration POC
 * Created: 2025-10-29
 */

const fs = require('fs');
const path = require('path');
const { runPocMigration } = require('../../specs/001-vercel-payload-migration/migrations/poc-migrate-10');

// Set environment to test mode
process.env.NODE_ENV = 'test';

// Paths
const REPORT_PATH = path.join(
  __dirname,
  '../../specs/001-vercel-payload-migration/migrations/poc-report.json'
);

describe('POC Migration Integration Test', () => {
  let report;

  beforeAll(async () => {
    // Delete existing report if it exists
    if (fs.existsSync(REPORT_PATH)) {
      fs.unlinkSync(REPORT_PATH);
    }

    // Run the POC migration in dry-run mode
    // The POC script always runs in dry-run mode when called from tests
    report = await runPocMigration();
  }, 30000); // 30 second timeout for migration

  describe('Report Generation', () => {
    it('should generate poc-report.json file', () => {
      expect(fs.existsSync(REPORT_PATH)).toBe(true);
    });

    it('should create valid JSON report', () => {
      const reportContent = fs.readFileSync(REPORT_PATH, 'utf8');
      expect(() => JSON.parse(reportContent)).not.toThrow();
    });
  });

  describe('Report Structure', () => {
    it('should have required metadata fields', () => {
      expect(report.metadata).toBeDefined();
      expect(report.metadata.startedAt).toBeDefined();
      expect(report.metadata.completedAt).toBeDefined();
      expect(report.metadata.mode).toBe('dry-run');
      expect(report.metadata.sourceFile).toBeDefined();
      expect(report.metadata.durationMs).toBeGreaterThanOrEqual(0);
    });

    it('should have summary section with all entity types', () => {
      expect(report.summary).toBeDefined();
      expect(report.summary.users).toBeDefined();
      expect(report.summary.media).toBeDefined();
      expect(report.summary.gameInstances).toBeDefined();
    });

    it('should have details section with migration records', () => {
      expect(report.details).toBeDefined();
      expect(report.details.users).toBeInstanceOf(Array);
      expect(report.details.media).toBeInstanceOf(Array);
      expect(report.details.gameInstances).toBeInstanceOf(Array);
    });

    it('should have errors array', () => {
      expect(report.errors).toBeDefined();
      expect(report.errors).toBeInstanceOf(Array);
    });
  });

  describe('Migration Success Criteria', () => {
    it('should have zero critical failures', () => {
      // Check for errors in the errors array
      const criticalErrors = report.errors.filter(
        (err) => err.type === 'critical' || err.severity === 'critical'
      );
      expect(criticalErrors).toHaveLength(0);
    });

    it('should have zero errors in total', () => {
      expect(report.errors).toHaveLength(0);
    });

    it('should successfully migrate all users', () => {
      expect(report.summary.users.total).toBeGreaterThan(0);
      expect(report.summary.users.succeeded).toBe(report.summary.users.total);
      expect(report.summary.users.failed).toBe(0);
    });

    it('should successfully migrate all media assets', () => {
      expect(report.summary.media.total).toBeGreaterThan(0);
      expect(report.summary.media.succeeded).toBe(report.summary.media.total);
      expect(report.summary.media.failed).toBe(0);
    });

    it('should successfully migrate all game instances', () => {
      expect(report.summary.gameInstances.total).toBeGreaterThan(0);
      expect(report.summary.gameInstances.succeeded).toBe(report.summary.gameInstances.total);
      expect(report.summary.gameInstances.failed).toBe(0);
    });
  });

  describe('User Migration Details', () => {
    it('should include all migrated users with required fields', () => {
      const users = report.details.users;
      expect(users.length).toBe(report.summary.users.total);

      users.forEach((user) => {
        expect(user.firebaseUid).toBeDefined();
        expect(user.payloadUserId).toBeDefined();
        expect(user.email).toBeDefined();
        expect(user.status).toBe('success');
      });
    });

    it('should generate unique Payload user IDs', () => {
      const users = report.details.users;
      const userIds = users.map((u) => u.payloadUserId);
      const uniqueIds = new Set(userIds);
      expect(uniqueIds.size).toBe(userIds.length);
    });
  });

  describe('Media Migration Details', () => {
    it('should include all migrated media with required fields', () => {
      const media = report.details.media;
      expect(media.length).toBe(report.summary.media.total);

      media.forEach((asset) => {
        expect(asset.payloadMediaId).toBeDefined();
        expect(asset.filename).toBeDefined();
        expect(asset.firebasePath).toBeDefined();
        expect(asset.vercelBlobUrl).toBeDefined();
        expect(asset.providerKey).toBeDefined();
        expect(asset.checksum).toBeDefined();
        expect(asset.size).toBeGreaterThan(0);
        expect(asset.mimeType).toBeDefined();
        expect(asset.status).toBe('success');
      });
    });

    it('should use correct Vercel Blob URL format', () => {
      const media = report.details.media;
      media.forEach((asset) => {
        expect(asset.vercelBlobUrl).toMatch(/^https:\/\/.*\.blob\.vercel-storage\.com\//);
      });
    });

    it('should generate correct migration paths', () => {
      const media = report.details.media;
      media.forEach((asset) => {
        expect(asset.providerKey).toMatch(/^migrations\//);
      });
    });

    it('should associate media with correct users', () => {
      const media = report.details.media;
      const users = report.details.users;
      const payloadUserIds = users.map((u) => u.payloadUserId);

      media.forEach((asset) => {
        if (asset.uploadedBy) {
          expect(payloadUserIds).toContain(asset.uploadedBy);
        }
      });
    });
  });

  describe('Game Instance Migration Details', () => {
    it('should include all migrated games with required fields', () => {
      const games = report.details.gameInstances;
      expect(games.length).toBe(report.summary.gameInstances.total);

      games.forEach((game) => {
        expect(game.payloadGameId).toBeDefined();
        expect(game.firebaseDocId).toBeDefined();
        expect(game.gameId).toBeDefined();
        expect(game.userId).toBeDefined();
        expect(game.status).toBe('success');
      });
    });

    it('should associate games with valid users', () => {
      const games = report.details.gameInstances;
      const users = report.details.users;
      const payloadUserIds = users.map((u) => u.payloadUserId);

      games.forEach((game) => {
        expect(payloadUserIds).toContain(game.userId);
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should complete migration in reasonable time', () => {
      // POC migration should complete in under 10 seconds
      expect(report.metadata.durationMs).toBeLessThan(10000);
    });

    it('should process at least 7 total records', () => {
      // Sample export has 2 users + 3 media + 2 games = 7 records
      const totalRecords =
        report.summary.users.total +
        report.summary.media.total +
        report.summary.gameInstances.total;

      expect(totalRecords).toBeGreaterThanOrEqual(7);
    });
  });

  describe('Data Integrity', () => {
    it('should preserve all checksums for media files', () => {
      const media = report.details.media;
      media.forEach((asset) => {
        expect(asset.checksum).toBeTruthy();
        expect(typeof asset.checksum).toBe('string');
      });
    });

    it('should maintain user-media relationships', () => {
      const media = report.details.media;
      const users = report.details.users;

      // Create a map of Firebase UID to Payload user ID
      const userIdMap = new Map();
      users.forEach((user) => {
        userIdMap.set(user.firebaseUid, user.payloadUserId);
      });

      // Verify media assets reference the correct mapped user IDs
      media.forEach((asset) => {
        if (asset.uploadedBy) {
          expect(userIdMap.has(asset.uploadedBy) || users.some(u => u.payloadUserId === asset.uploadedBy)).toBe(true);
        }
      });
    });

    it('should maintain user-game relationships', () => {
      const games = report.details.gameInstances;
      const users = report.details.users;
      const payloadUserIds = users.map((u) => u.payloadUserId);

      games.forEach((game) => {
        expect(payloadUserIds).toContain(game.userId);
      });
    });
  });
});

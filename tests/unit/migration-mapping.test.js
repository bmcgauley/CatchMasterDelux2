/**
 * Unit Tests for Firebase to Payload Mapping Functions
 *
 * Tests the mapping functions that transform Firebase data to Payload CMS format.
 * Covers users, media assets, and game instances mapping.
 *
 * Test cases:
 * 1. Image file mapping - Standard media asset with complete metadata
 * 2. Avatar mapping - User with avatar URL
 * 3. Missing fields - Handling of optional/missing fields
 *
 * Related: T018 - Unit tests for mapping logic
 * Created: 2025-10-29
 */

const {
  mapUserToPayload,
  mapMediaToPayload,
  mapGameInstanceToPayload,
  generateMigrationPath,
  isAlreadyMigrated,
  validateMigratedData,
} = require('../../specs/001-vercel-payload-migration/migrations/mapping/firebase-to-payload');

describe('Firebase to Payload Mapping', () => {
  describe('mapUserToPayload', () => {
    it('should map complete Firebase user to Payload format', () => {
      const firebaseUser = {
        uid: 'firebase-abc123',
        email: 'trainer@pokemon.com',
        displayName: 'Ash Ketchum',
        photoURL: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/avatars%2Fash.jpg',
        metadata: {
          creationTime: '2023-01-15T10:30:00.000Z',
          lastSignInTime: '2025-10-28T14:22:00.000Z',
        },
        customField: 'some legacy data',
      };

      const result = mapUserToPayload(firebaseUser);

      expect(result).toMatchObject({
        authUid: 'firebase-abc123',
        email: 'trainer@pokemon.com',
        displayName: 'Ash Ketchum',
        avatar: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/avatars%2Fash.jpg',
        createdAt: '2023-01-15T10:30:00.000Z',
        lastActiveAt: '2025-10-28T14:22:00.000Z',
      });

      expect(result.legacyMetadata).toMatchObject({
        firebaseUid: 'firebase-abc123',
        customField: 'some legacy data',
        sourceCollection: 'users',
      });

      expect(result.legacyMetadata.migratedAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should handle user with minimal fields', () => {
      const firebaseUser = {
        uid: 'firebase-minimal',
        email: 'minimal@test.com',
      };

      const result = mapUserToPayload(firebaseUser);

      expect(result).toMatchObject({
        authUid: 'firebase-minimal',
        email: 'minimal@test.com',
        displayName: null,
        avatar: null,
      });

      expect(result.createdAt).toBeDefined();
      expect(result.lastActiveAt).toBeDefined();
    });

    it('should handle user with missing email (use authUid only)', () => {
      const firebaseUser = {
        uid: 'firebase-no-email',
        displayName: 'Anonymous User',
        metadata: {
          creationTime: '2024-01-01T00:00:00.000Z',
        },
      };

      const result = mapUserToPayload(firebaseUser);

      expect(result).toMatchObject({
        authUid: 'firebase-no-email',
        email: null,
        displayName: 'Anonymous User',
      });
    });

    it('should throw error for user without uid', () => {
      const invalidUser = {
        email: 'test@test.com',
      };

      expect(() => mapUserToPayload(invalidUser)).toThrow('Invalid Firebase user: uid is required');
    });
  });

  describe('mapMediaToPayload', () => {
    it('should map complete Firebase storage object to Payload mediaAssets', () => {
      const firebaseObject = {
        name: 'user-uploads/sprites/pikachu-shiny.png',
        bucket: 'catchmaster-prod.appspot.com',
        contentType: 'image/png',
        size: 45678,
        md5Hash: 'rL0Y20zC+Fzt72VPzMSk2A==',
        timeCreated: '2024-03-10T08:15:00.000Z',
        metadata: {
          uploadedBy: 'firebase-abc123',
          altText: 'Shiny Pikachu sprite',
        },
      };

      const vercelBlob = {
        url: 'https://abc123xyz.public.blob.vercel-storage.com/migrations/catchmaster-prod/user-uploads/sprites/pikachu-shiny.png',
        pathname: 'migrations/catchmaster-prod/user-uploads/sprites/pikachu-shiny.png',
      };

      const result = mapMediaToPayload(firebaseObject, vercelBlob, 'user-uuid-456');

      expect(result).toMatchObject({
        filename: 'pikachu-shiny.png',
        mimeType: 'image/png',
        size: 45678,
        storageProvider: 'vercel_blob',
        providerUrl: 'https://abc123xyz.public.blob.vercel-storage.com/migrations/catchmaster-prod/user-uploads/sprites/pikachu-shiny.png',
        providerKey: 'migrations/catchmaster-prod/user-uploads/sprites/pikachu-shiny.png',
        uploadedBy: 'user-uuid-456',
        uploadedAt: '2024-03-10T08:15:00.000Z',
        checksum: 'rL0Y20zC+Fzt72VPzMSk2A==',
      });

      expect(result.metadata).toMatchObject({
        altText: 'Shiny Pikachu sprite',
      });

      expect(result.legacyMetadata).toMatchObject({
        firebaseBucket: 'catchmaster-prod.appspot.com',
        firebasePath: 'user-uploads/sprites/pikachu-shiny.png',
        sourceCollection: 'storage',
      });
    });

    it('should handle media without uploader information', () => {
      const firebaseObject = {
        name: 'public/banner.jpg',
        bucket: 'public-bucket.appspot.com',
        contentType: 'image/jpeg',
        size: 123456,
        timeCreated: '2024-01-01T00:00:00.000Z',
      };

      const vercelBlob = {
        url: 'https://blob.vercel-storage.com/banner.jpg',
        pathname: 'migrations/public-bucket/public/banner.jpg',
      };

      const result = mapMediaToPayload(firebaseObject, vercelBlob);

      expect(result).toMatchObject({
        filename: 'banner.jpg',
        mimeType: 'image/jpeg',
        size: 123456,
        uploadedBy: null,
      });

      expect(result.metadata).toEqual({});
    });

    it('should handle missing optional fields with defaults', () => {
      const firebaseObject = {
        name: 'test.png',
        bucket: 'test-bucket',
      };

      const vercelBlob = {
        url: 'https://blob.vercel-storage.com/test.png',
        pathname: 'migrations/test-bucket/test.png',
      };

      const result = mapMediaToPayload(firebaseObject, vercelBlob);

      expect(result).toMatchObject({
        filename: 'test.png',
        mimeType: 'application/octet-stream', // Default when contentType missing
        size: 0, // Default when size missing
        checksum: null, // No checksum available
      });
    });

    it('should throw error for invalid storage object', () => {
      expect(() => mapMediaToPayload({}, { url: 'test', pathname: 'test' })).toThrow(
        'Invalid Firebase Storage object: name is required'
      );
    });

    it('should throw error for invalid Vercel Blob info', () => {
      const firebaseObject = { name: 'test.png', bucket: 'bucket' };

      expect(() => mapMediaToPayload(firebaseObject, { url: 'test' })).toThrow(
        'Invalid Vercel Blob info: url and pathname are required'
      );
    });
  });

  describe('mapGameInstanceToPayload', () => {
    it('should map complete Firebase game instance to Payload format', () => {
      const firebaseGame = {
        id: 'game-doc-123',
        userId: 'firebase-abc123',
        gameId: 'pokemon-red',
        ownership: {
          condition: 'good',
          purchaseDate: '2023-05-20',
          purchasePrice: 29.99,
        },
        progress: {
          badges: 8,
          pokedexCompletion: 142,
          playTime: 48.5,
        },
        boxes: [{ number: 1, pokemon: [] }],
        party: [{ species: 'pikachu', level: 55 }],
        createdAt: '2023-05-21T00:00:00.000Z',
        updatedAt: '2025-10-28T12:00:00.000Z',
        customGameField: 'legacy data',
      };

      const result = mapGameInstanceToPayload(firebaseGame, 'payload-user-uuid-456');

      expect(result).toMatchObject({
        user: 'payload-user-uuid-456',
        gameId: 'pokemon-red',
        createdAt: '2023-05-21T00:00:00.000Z',
        updatedAt: '2025-10-28T12:00:00.000Z',
      });

      expect(result.state).toMatchObject({
        ownership: {
          condition: 'good',
          purchaseDate: '2023-05-20',
          purchasePrice: 29.99,
        },
        progress: {
          badges: 8,
          pokedexCompletion: 142,
          playTime: 48.5,
        },
        boxes: [{ number: 1, pokemon: [] }],
        party: [{ species: 'pikachu', level: 55 }],
      });

      expect(result.legacyMetadata).toMatchObject({
        firebaseDocId: 'game-doc-123',
        firebaseUserId: 'firebase-abc123',
        customGameField: 'legacy data',
        sourceCollection: 'gameInstances',
      });
    });

    it('should handle game instance with minimal fields', () => {
      const firebaseGame = {
        userId: 'firebase-user',
        gameId: 'pokemon-blue',
      };

      const result = mapGameInstanceToPayload(firebaseGame, 'payload-user-123');

      expect(result).toMatchObject({
        user: 'payload-user-123',
        gameId: 'pokemon-blue',
      });

      expect(result.state).toMatchObject({
        ownership: {},
        progress: {},
        boxes: [],
        party: [],
      });
    });

    it('should throw error for game without gameId', () => {
      expect(() => mapGameInstanceToPayload({ userId: 'test' }, 'user-123')).toThrow(
        'Invalid Firebase game document: gameId is required'
      );
    });

    it('should throw error without payload userId', () => {
      expect(() => mapGameInstanceToPayload({ gameId: 'pokemon-red' }, null)).toThrow(
        'Payload userId is required for game instance mapping'
      );
    });
  });

  describe('generateMigrationPath', () => {
    it('should generate correct migration path', () => {
      const result = generateMigrationPath('catchmaster-prod.appspot.com', 'user-uploads/sprites/pikachu.png');

      expect(result).toBe('migrations/catchmaster-prod/user-uploads/sprites/pikachu.png');
    });

    it('should handle bucket names without .appspot.com', () => {
      const result = generateMigrationPath('my-bucket', 'path/to/file.jpg');

      expect(result).toBe('migrations/my-bucket/path/to/file.jpg');
    });
  });

  describe('isAlreadyMigrated', () => {
    it('should return true for matching assets', () => {
      const existing = {
        providerKey: 'migrations/bucket/path/file.png',
        checksum: 'abc123',
      };

      const incoming = {
        providerKey: 'migrations/bucket/path/file.png',
        checksum: 'abc123',
      };

      expect(isAlreadyMigrated(existing, incoming)).toBe(true);
    });

    it('should return false for different checksums', () => {
      const existing = {
        providerKey: 'migrations/bucket/path/file.png',
        checksum: 'abc123',
      };

      const incoming = {
        providerKey: 'migrations/bucket/path/file.png',
        checksum: 'xyz789',
      };

      expect(isAlreadyMigrated(existing, incoming)).toBe(false);
    });

    it('should return false for different paths', () => {
      const existing = {
        providerKey: 'migrations/bucket/path1/file.png',
        checksum: 'abc123',
      };

      const incoming = {
        providerKey: 'migrations/bucket/path2/file.png',
        checksum: 'abc123',
      };

      expect(isAlreadyMigrated(existing, incoming)).toBe(false);
    });

    it('should return false for null inputs', () => {
      expect(isAlreadyMigrated(null, {})).toBe(false);
      expect(isAlreadyMigrated({}, null)).toBe(false);
    });
  });

  describe('validateMigratedData', () => {
    it('should validate correct user data', () => {
      const userData = {
        authUid: 'test-uid',
        email: 'test@test.com',
      };

      expect(() => validateMigratedData(userData, 'user')).not.toThrow();
    });

    it('should validate user with only authUid', () => {
      const userData = {
        authUid: 'test-uid',
      };

      expect(() => validateMigratedData(userData, 'user')).not.toThrow();
    });

    it('should throw for user without email or authUid', () => {
      const userData = {
        displayName: 'Test User',
      };

      expect(() => validateMigratedData(userData, 'user')).toThrow('User must have either email or authUid');
    });

    it('should validate correct media data', () => {
      const mediaData = {
        providerUrl: 'https://blob.vercel-storage.com/file.png',
        storageProvider: 'vercel_blob',
        size: 1000,
      };

      expect(() => validateMigratedData(mediaData, 'media')).not.toThrow();
    });

    it('should throw for media without providerUrl', () => {
      const mediaData = {
        storageProvider: 'vercel_blob',
      };

      expect(() => validateMigratedData(mediaData, 'media')).toThrow('Media asset must have providerUrl');
    });

    it('should throw for media without storageProvider', () => {
      const mediaData = {
        providerUrl: 'https://blob.vercel-storage.com/file.png',
      };

      expect(() => validateMigratedData(mediaData, 'media')).toThrow('Media asset must have storageProvider');
    });

    it('should throw for media exceeding max size (50MB)', () => {
      const mediaData = {
        providerUrl: 'https://blob.vercel-storage.com/file.png',
        storageProvider: 'vercel_blob',
        size: 51 * 1024 * 1024, // 51MB
      };

      expect(() => validateMigratedData(mediaData, 'media')).toThrow('Media asset exceeds max size of 50MB');
    });

    it('should validate correct game instance data', () => {
      const gameData = {
        user: 'user-uuid',
        gameId: 'pokemon-red',
      };

      expect(() => validateMigratedData(gameData, 'gameInstance')).not.toThrow();
    });

    it('should throw for game instance without user', () => {
      const gameData = {
        gameId: 'pokemon-red',
      };

      expect(() => validateMigratedData(gameData, 'gameInstance')).toThrow('Game instance must have user relation');
    });

    it('should throw for game instance without gameId', () => {
      const gameData = {
        user: 'user-uuid',
      };

      expect(() => validateMigratedData(gameData, 'gameInstance')).toThrow('Game instance must have gameId');
    });

    it('should throw for unknown collection type', () => {
      expect(() => validateMigratedData({}, 'unknown')).toThrow('Unknown collection type: unknown');
    });
  });
});

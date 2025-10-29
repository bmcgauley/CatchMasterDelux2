/**
 * Firebase to Payload CMS Field Mapping
 *
 * This module defines transformation logic for migrating data from Firebase
 * (Firestore documents & Storage objects) to Payload CMS collections backed by Postgres.
 *
 * Design principles:
 * - All mappers are pure functions (no side effects)
 * - Preserve original data in legacyMetadata for audit/rollback
 * - Generate stable IDs where possible (for idempotency)
 * - Handle missing/null fields gracefully
 */

/**
 * Map Firebase user document to Payload users collection
 *
 * @param {Object} firebaseUser - Firebase user document
 * @param {string} firebaseUser.uid - Firebase authentication UID
 * @param {string} firebaseUser.email - User email
 * @param {string} [firebaseUser.displayName] - User display name
 * @param {string} [firebaseUser.photoURL] - Firebase storage URL for avatar
 * @param {Object} [firebaseUser.metadata] - Firebase auth metadata
 * @param {string} [firebaseUser.metadata.lastSignInTime] - Last sign in timestamp
 * @param {string} [firebaseUser.metadata.creationTime] - Account creation timestamp
 * @returns {Object} Payload users collection document
 *
 * @example
 * // Input: Firebase user
 * const firebaseUser = {
 *   uid: 'firebase-abc123',
 *   email: 'trainer@pokemon.com',
 *   displayName: 'Ash Ketchum',
 *   photoURL: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/avatars%2Fash.jpg',
 *   metadata: {
 *     creationTime: '2023-01-15T10:30:00.000Z',
 *     lastSignInTime: '2025-10-28T14:22:00.000Z'
 *   },
 *   customField: 'some legacy data'
 * };
 *
 * // Output: Payload users document
 * const payloadUser = mapUserToPayload(firebaseUser);
 * // {
 * //   authUid: 'firebase-abc123',
 * //   email: 'trainer@pokemon.com',
 * //   displayName: 'Ash Ketchum',
 * //   avatar: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/avatars%2Fash.jpg',
 * //   createdAt: '2023-01-15T10:30:00.000Z',
 * //   lastActiveAt: '2025-10-28T14:22:00.000Z',
 * //   legacyMetadata: {
 * //     firebaseUid: 'firebase-abc123',
 * //     customField: 'some legacy data',
 * //     migratedAt: '2025-10-29T...',
 * //     sourceCollection: 'users'
 * //   }
 * // }
 */
function mapUserToPayload(firebaseUser) {
  if (!firebaseUser || !firebaseUser.uid) {
    throw new Error('Invalid Firebase user: uid is required');
  }

  const now = new Date().toISOString();

  // Extract known fields
  const {
    uid,
    email,
    displayName,
    photoURL,
    metadata,
    ...extraFields
  } = firebaseUser;

  // Build Payload document
  const payloadUser = {
    authUid: uid,
    email: email || null,
    displayName: displayName || null,
    avatar: photoURL || null, // Will be replaced by mediaAssets relation after media migration
    createdAt: metadata?.creationTime || now,
    updatedAt: now,
    lastActiveAt: metadata?.lastSignInTime || metadata?.creationTime || now,
    legacyMetadata: {
      firebaseUid: uid,
      migratedAt: now,
      sourceCollection: 'users',
      ...extraFields // Preserve any custom fields
    }
  };

  return payloadUser;
}

/**
 * Map Firebase Storage object metadata to Payload mediaAssets collection
 *
 * @param {Object} firebaseStorageObject - Firebase Storage object metadata
 * @param {string} firebaseStorageObject.name - Object path/name in Firebase Storage
 * @param {string} firebaseStorageObject.bucket - Firebase Storage bucket name
 * @param {string} firebaseStorageObject.contentType - MIME type
 * @param {number} firebaseStorageObject.size - File size in bytes
 * @param {string} [firebaseStorageObject.md5Hash] - Base64 encoded MD5 hash
 * @param {string} [firebaseStorageObject.timeCreated] - Creation timestamp
 * @param {Object} [firebaseStorageObject.metadata] - Custom metadata
 * @param {Object} vercelBlobInfo - Vercel Blob upload result
 * @param {string} vercelBlobInfo.url - Vercel Blob public URL
 * @param {string} vercelBlobInfo.pathname - Blob storage path
 * @param {string} [uploadedByUserId] - Payload user ID who uploaded this asset
 * @returns {Object} Payload mediaAssets collection document
 *
 * @example
 * // Input: Firebase Storage metadata
 * const firebaseObject = {
 *   name: 'user-uploads/sprites/pikachu-shiny.png',
 *   bucket: 'catchmaster-prod.appspot.com',
 *   contentType: 'image/png',
 *   size: 45678,
 *   md5Hash: 'rL0Y20zC+Fzt72VPzMSk2A==',
 *   timeCreated: '2024-03-10T08:15:00.000Z',
 *   metadata: {
 *     uploadedBy: 'firebase-abc123',
 *     altText: 'Shiny Pikachu sprite'
 *   }
 * };
 *
 * const vercelBlob = {
 *   url: 'https://abc123xyz.public.blob.vercel-storage.com/migrations/catchmaster-prod/user-uploads/sprites/pikachu-shiny.png',
 *   pathname: 'migrations/catchmaster-prod/user-uploads/sprites/pikachu-shiny.png'
 * };
 *
 * // Output: Payload mediaAssets document
 * const payloadMedia = mapMediaToPayload(firebaseObject, vercelBlob, 'user-uuid-456');
 * // {
 * //   filename: 'pikachu-shiny.png',
 * //   mimeType: 'image/png',
 * //   size: 45678,
 * //   storageProvider: 'vercel_blob',
 * //   providerUrl: 'https://abc123xyz.public.blob.vercel-storage.com/migrations/...',
 * //   providerKey: 'migrations/catchmaster-prod/user-uploads/sprites/pikachu-shiny.png',
 * //   uploadedBy: 'user-uuid-456',
 * //   uploadedAt: '2024-03-10T08:15:00.000Z',
 * //   checksum: 'rL0Y20zC+Fzt72VPzMSk2A==',
 * //   metadata: {
 * //     altText: 'Shiny Pikachu sprite'
 * //   },
 * //   legacyMetadata: {
 * //     firebaseBucket: 'catchmaster-prod.appspot.com',
 * //     firebasePath: 'user-uploads/sprites/pikachu-shiny.png',
 * //     migratedAt: '2025-10-29T...',
 * //     sourceCollection: 'storage'
 * //   }
 * // }
 */
function mapMediaToPayload(firebaseStorageObject, vercelBlobInfo, uploadedByUserId = null) {
  if (!firebaseStorageObject || !firebaseStorageObject.name) {
    throw new Error('Invalid Firebase Storage object: name is required');
  }
  if (!vercelBlobInfo || !vercelBlobInfo.url || !vercelBlobInfo.pathname) {
    throw new Error('Invalid Vercel Blob info: url and pathname are required');
  }

  const now = new Date().toISOString();

  // Extract filename from path
  const pathParts = firebaseStorageObject.name.split('/');
  const filename = pathParts[pathParts.length - 1] || firebaseStorageObject.name;

  // Extract custom metadata (excluding system fields)
  const { uploadedBy, ...customMetadata } = firebaseStorageObject.metadata || {};

  const payloadMedia = {
    filename,
    mimeType: firebaseStorageObject.contentType || 'application/octet-stream',
    size: firebaseStorageObject.size || 0,
    storageProvider: 'vercel_blob',
    providerUrl: vercelBlobInfo.url,
    providerKey: vercelBlobInfo.pathname,
    uploadedBy: uploadedByUserId,
    uploadedAt: firebaseStorageObject.timeCreated || now,
    checksum: firebaseStorageObject.md5Hash || null, // Base64 MD5 from Firebase
    metadata: customMetadata,
    legacyMetadata: {
      firebaseBucket: firebaseStorageObject.bucket,
      firebasePath: firebaseStorageObject.name,
      migratedAt: now,
      sourceCollection: 'storage'
    }
  };

  return payloadMedia;
}

/**
 * Map Firebase game instance document to Payload gameInstances collection
 *
 * @param {Object} firebaseGameDoc - Firebase game instance document
 * @param {string} firebaseGameDoc.id - Firestore document ID
 * @param {string} firebaseGameDoc.userId - Firebase user UID who owns this game
 * @param {string} firebaseGameDoc.gameId - Game catalog ID (e.g., 'pokemon-red')
 * @param {Object} [firebaseGameDoc.ownership] - Ownership metadata
 * @param {string} [firebaseGameDoc.ownership.condition] - Game condition
 * @param {string} [firebaseGameDoc.ownership.purchaseDate] - Purchase date
 * @param {number} [firebaseGameDoc.ownership.purchasePrice] - Purchase price
 * @param {Object} [firebaseGameDoc.progress] - Game progress data
 * @param {Array} [firebaseGameDoc.boxes] - Pokemon box data
 * @param {Array} [firebaseGameDoc.party] - Party Pokemon
 * @param {string} [firebaseGameDoc.createdAt] - Document creation timestamp
 * @param {string} [firebaseGameDoc.updatedAt] - Document update timestamp
 * @param {string} payloadUserId - Payload user ID (mapped from Firebase userId)
 * @returns {Object} Payload gameInstances collection document
 *
 * @example
 * // Input: Firebase game instance
 * const firebaseGame = {
 *   id: 'game-doc-123',
 *   userId: 'firebase-abc123',
 *   gameId: 'pokemon-red',
 *   ownership: {
 *     condition: 'good',
 *     purchaseDate: '2023-05-20',
 *     purchasePrice: 29.99
 *   },
 *   progress: {
 *     badges: 8,
 *     pokedexCompletion: 142,
 *     playTime: 48.5
 *   },
 *   boxes: [
 *     { number: 1, pokemon: [...] },
 *     { number: 2, pokemon: [...] }
 *   ],
 *   party: [
 *     { species: 'pikachu', level: 55, nickname: 'Sparky' }
 *   ],
 *   createdAt: '2023-05-21T00:00:00.000Z',
 *   updatedAt: '2025-10-28T12:00:00.000Z',
 *   customGameField: 'legacy data'
 * };
 *
 * // Output: Payload gameInstances document
 * const payloadGame = mapGameInstanceToPayload(firebaseGame, 'payload-user-uuid-456');
 * // {
 * //   user: 'payload-user-uuid-456',
 * //   gameId: 'pokemon-red',
 * //   state: {
 * //     ownership: {
 * //       condition: 'good',
 * //       purchaseDate: '2023-05-20',
 * //       purchasePrice: 29.99
 * //     },
 * //     progress: {
 * //       badges: 8,
 * //       pokedexCompletion: 142,
 * //       playTime: 48.5
 * //     },
 * //     boxes: [...],
 * //     party: [...]
 * //   },
 * //   createdAt: '2023-05-21T00:00:00.000Z',
 * //   updatedAt: '2025-10-28T12:00:00.000Z',
 * //   legacyMetadata: {
 * //     firebaseDocId: 'game-doc-123',
 * //     firebaseUserId: 'firebase-abc123',
 * //     customGameField: 'legacy data',
 * //     migratedAt: '2025-10-29T...',
 * //     sourceCollection: 'gameInstances'
 * //   }
 * // }
 */
function mapGameInstanceToPayload(firebaseGameDoc, payloadUserId) {
  if (!firebaseGameDoc || !firebaseGameDoc.gameId) {
    throw new Error('Invalid Firebase game document: gameId is required');
  }
  if (!payloadUserId) {
    throw new Error('Payload userId is required for game instance mapping');
  }

  const now = new Date().toISOString();

  const {
    id,
    userId: firebaseUserId,
    gameId,
    ownership,
    progress,
    boxes,
    party,
    createdAt,
    updatedAt,
    ...extraFields
  } = firebaseGameDoc;

  // Consolidate game-specific state into single JSON field
  const state = {
    ownership: ownership || {},
    progress: progress || {},
    boxes: boxes || [],
    party: party || []
  };

  const payloadGame = {
    user: payloadUserId, // Relation to Payload users collection
    gameId,
    state,
    createdAt: createdAt || now,
    updatedAt: updatedAt || now,
    legacyMetadata: {
      firebaseDocId: id,
      firebaseUserId,
      migratedAt: now,
      sourceCollection: 'gameInstances',
      ...extraFields // Preserve any custom fields
    }
  };

  return payloadGame;
}

/**
 * Generate migration path for Firebase Storage object in Vercel Blob
 * Follows pattern: /migrations/{origBucket}/{objectPath}
 *
 * @param {string} bucket - Firebase Storage bucket name
 * @param {string} objectPath - Object path in Firebase Storage
 * @returns {string} Target path for Vercel Blob
 *
 * @example
 * generateMigrationPath('catchmaster-prod.appspot.com', 'user-uploads/sprites/pikachu.png')
 * // Returns: 'migrations/catchmaster-prod/user-uploads/sprites/pikachu.png'
 */
function generateMigrationPath(bucket, objectPath) {
  // Sanitize bucket name (remove .appspot.com suffix if present)
  const bucketName = bucket.replace('.appspot.com', '');
  return `migrations/${bucketName}/${objectPath}`;
}

/**
 * Check if a media asset has already been migrated based on providerKey and checksum
 * Used for idempotent migration operations
 *
 * @param {Object} existingAsset - Existing Payload mediaAssets document
 * @param {Object} newAsset - New asset data to compare
 * @returns {boolean} True if assets match (already migrated)
 *
 * @example
 * const existing = {
 *   providerKey: 'migrations/bucket/path/file.png',
 *   checksum: 'abc123'
 * };
 * const incoming = {
 *   providerKey: 'migrations/bucket/path/file.png',
 *   checksum: 'abc123'
 * };
 * isAlreadyMigrated(existing, incoming); // Returns: true
 */
function isAlreadyMigrated(existingAsset, newAsset) {
  if (!existingAsset || !newAsset) return false;

  // Match on providerKey (storage path) and checksum
  return (
    existingAsset.providerKey === newAsset.providerKey &&
    existingAsset.checksum === newAsset.checksum
  );
}

/**
 * Validate migrated data meets minimum requirements
 * Throws error if validation fails
 *
 * @param {Object} data - Data to validate
 * @param {string} collectionType - Type of collection ('user', 'media', 'gameInstance')
 * @throws {Error} If validation fails
 */
function validateMigratedData(data, collectionType) {
  switch (collectionType) {
    case 'user':
      if (!data.email && !data.authUid) {
        throw new Error('User must have either email or authUid');
      }
      break;

    case 'media':
      if (!data.providerUrl) {
        throw new Error('Media asset must have providerUrl');
      }
      if (!data.storageProvider) {
        throw new Error('Media asset must have storageProvider');
      }
      // Enforce max size (50MB as per data-model.md)
      const MAX_SIZE = 50 * 1024 * 1024; // 50MB in bytes
      if (data.size > MAX_SIZE) {
        throw new Error(`Media asset exceeds max size of 50MB: ${data.size} bytes`);
      }
      break;

    case 'gameInstance':
      if (!data.user) {
        throw new Error('Game instance must have user relation');
      }
      if (!data.gameId) {
        throw new Error('Game instance must have gameId');
      }
      break;

    default:
      throw new Error(`Unknown collection type: ${collectionType}`);
  }
}

// Export all mapping functions
module.exports = {
  mapUserToPayload,
  mapMediaToPayload,
  mapGameInstanceToPayload,
  generateMigrationPath,
  isAlreadyMigrated,
  validateMigratedData
};

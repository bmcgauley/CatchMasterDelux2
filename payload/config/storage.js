/**
 * Vercel Blob Storage Configuration
 *
 * Configures Vercel Blob as the primary storage provider for media assets.
 * Uses @payloadcms/storage-vercel-blob adapter.
 *
 * Related to: T010 - Vercel Blob storage adapter implementation
 */

const { vercelBlobStorage } = require('@payloadcms/storage-vercel-blob');

/**
 * Creates storage configuration for Payload CMS
 * @returns {Object} Storage adapter configuration
 */
const createStorageAdapter = () => {
  const token = process.env.VERCEL_BLOB_TOKEN;
  const bucket = process.env.VERCEL_BLOB_BUCKET;

  if (!token) {
    console.warn('⚠️  VERCEL_BLOB_TOKEN not set - storage adapter will not function');
  }

  if (!bucket) {
    console.warn('⚠️  VERCEL_BLOB_BUCKET not set - using default bucket');
  }

  return vercelBlobStorage({
    collections: {
      'media-assets': true,
    },
    token: token || '',
    // Additional Vercel Blob configuration
    addRandomSuffix: true, // Prevent filename collisions
    cacheControlMaxAge: 31536000, // 1 year cache for immutable assets
  });
};

module.exports = {
  createStorageAdapter,
};

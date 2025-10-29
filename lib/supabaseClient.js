/**
 * Supabase Client Wrapper
 *
 * Provides a centralized Supabase client for database and storage operations.
 * Configured as a fallback/backup for primary Vercel infrastructure.
 *
 * Related to: T013 - Supabase configuration
 * Created: 2025-10-29
 */

const { createClient } = require('@supabase/supabase-js');

let supabaseClient = null;

/**
 * Initialize and return a Supabase client
 *
 * @returns {Object} Supabase client instance
 * @throws {Error} If required environment variables are missing
 */
function getSupabaseClient() {
  // Return existing client if already initialized
  if (supabaseClient) {
    return supabaseClient;
  }

  // Get configuration from environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  // Validate required configuration
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required');
  }

  if (!supabaseKey) {
    throw new Error('SUPABASE_KEY environment variable is required');
  }

  // Create and cache client
  supabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Server-side, no session persistence needed
    },
  });

  console.log('✓ Supabase client initialized');
  return supabaseClient;
}

/**
 * Upload a file to Supabase Storage
 *
 * @param {Buffer} fileBuffer - File content as buffer
 * @param {string} key - Storage key/path for the file
 * @param {Object} options - Upload options
 * @param {string} options.bucket - Storage bucket name (default: 'catchmaster-media')
 * @param {string} options.contentType - File MIME type
 * @param {boolean} options.upsert - Whether to overwrite existing files (default: false)
 * @returns {Promise<Object>} Upload result with publicUrl
 */
async function uploadToSupabaseStorage(fileBuffer, key, options = {}) {
  const {
    bucket = 'catchmaster-media',
    contentType = 'application/octet-stream',
    upsert = false,
  } = options;

  const client = getSupabaseClient();

  console.log(`[Supabase] Uploading file to bucket "${bucket}" with key "${key}"`);

  try {
    // Upload file
    const { data, error } = await client.storage
      .from(bucket)
      .upload(key, fileBuffer, {
        contentType,
        upsert,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: publicUrlData } = client.storage
      .from(bucket)
      .getPublicUrl(key);

    console.log(`[Supabase] ✓ File uploaded successfully: ${publicUrlData.publicUrl}`);

    return {
      key: data.path,
      publicUrl: publicUrlData.publicUrl,
      bucket,
    };
  } catch (error) {
    console.error(`[Supabase] ✗ Upload failed:`, error.message);
    throw error;
  }
}

/**
 * Delete a file from Supabase Storage
 *
 * @param {string} key - Storage key/path of the file to delete
 * @param {Object} options - Delete options
 * @param {string} options.bucket - Storage bucket name (default: 'catchmaster-media')
 * @returns {Promise<void>}
 */
async function deleteFromSupabaseStorage(key, options = {}) {
  const { bucket = 'catchmaster-media' } = options;

  const client = getSupabaseClient();

  console.log(`[Supabase] Deleting file from bucket "${bucket}" with key "${key}"`);

  try {
    const { error } = await client.storage
      .from(bucket)
      .remove([key]);

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }

    console.log(`[Supabase] ✓ File deleted successfully`);
  } catch (error) {
    console.error(`[Supabase] ✗ Delete failed:`, error.message);
    throw error;
  }
}

/**
 * Check if Supabase is configured and reachable
 *
 * @returns {Promise<boolean>} True if Supabase is available
 */
async function checkSupabaseHealth() {
  try {
    const client = getSupabaseClient();

    // Simple query to check connectivity
    const { error } = await client
      .from('migration_log')
      .select('count', { count: 'exact', head: true });

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = table not found (acceptable for health check)
      console.warn(`[Supabase] Health check warning: ${error.message}`);
      return false;
    }

    console.log('[Supabase] ✓ Health check passed');
    return true;
  } catch (error) {
    console.error('[Supabase] ✗ Health check failed:', error.message);
    return false;
  }
}

/**
 * Reset the Supabase client (mainly for testing)
 */
function resetSupabaseClient() {
  supabaseClient = null;
}

module.exports = {
  getSupabaseClient,
  uploadToSupabaseStorage,
  deleteFromSupabaseStorage,
  checkSupabaseHealth,
  resetSupabaseClient,
};

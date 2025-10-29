/**
 * Upload Service
 *
 * Handles file uploads to the backend API with progress tracking and error handling.
 * Communicates with the /api/upload endpoint.
 *
 * Related: T020 - Frontend upload flow
 * Created: 2025-10-29
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const UPLOAD_ENDPOINT = `${API_BASE_URL}/api/upload`;

/**
 * Upload a file to the server
 *
 * @param {File} file - File object from input element
 * @param {Object} options - Upload options
 * @param {string} [options.userId] - User ID (optional, will be handled by auth)
 * @param {Function} [options.onProgress] - Progress callback (progress: 0-100)
 * @param {AbortSignal} [options.signal] - AbortSignal for cancellation
 * @returns {Promise<Object>} Upload result with mediaAsset data
 * @throws {Error} Upload errors with user-friendly messages
 */
export async function uploadFile(file, options = {}) {
  const { userId, onProgress, signal } = options;

  // Validate file
  if (!file) {
    throw new Error('No file provided');
  }

  // Check file size (50MB max)
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds 50MB limit. Your file is ${formatFileSize(file.size)}.`);
  }

  // Check file type
  const ALLOWED_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed types: PNG, JPEG, GIF, WebP, SVG.`
    );
  }

  // Create FormData
  const formData = new FormData();
  formData.append('file', file);
  if (userId) {
    formData.append('userId', userId);
  }

  // Upload with progress tracking
  try {
    const response = await uploadWithProgress(formData, {
      onProgress,
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.mediaAsset;
  } catch (error) {
    // Handle network errors
    if (error.name === 'AbortError') {
      throw new Error('Upload cancelled');
    }

    // Re-throw with original message if it's already user-friendly
    throw error;
  }
}

/**
 * Upload with XMLHttpRequest to track progress
 *
 * @param {FormData} formData - Form data to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Response>} Fetch-like response object
 */
function uploadWithProgress(formData, options = {}) {
  const { onProgress, signal } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Handle abort signal
    if (signal) {
      signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new DOMException('Upload aborted', 'AbortError'));
      });
    }

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });
    }

    // Handle completion
    xhr.addEventListener('load', () => {
      // Convert XHR response to fetch-like Response
      const response = {
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
        json: async () => JSON.parse(xhr.responseText),
      };
      resolve(response);
    });

    // Handle errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });

    xhr.addEventListener('abort', () => {
      reject(new DOMException('Upload aborted', 'AbortError'));
    });

    // Send request
    xhr.open('POST', UPLOAD_ENDPOINT);
    xhr.send(formData);
  });
}

/**
 * Format file size for display
 *
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted size (e.g., "2.5 MB")
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file before upload
 *
 * @param {File} file - File to validate
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 50MB limit. Your file is ${formatFileSize(file.size)}.`,
    };
  }

  const ALLOWED_TYPES = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: PNG, JPEG, GIF, WebP, SVG.`,
    };
  }

  return { valid: true };
}

/**
 * Get upload health status
 *
 * @returns {Promise<Object>} Health status
 */
export async function getUploadHealth() {
  try {
    const response = await fetch(`${UPLOAD_ENDPOINT}/health`);
    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: 'Unable to reach upload service',
    };
  }
}

export { formatFileSize };

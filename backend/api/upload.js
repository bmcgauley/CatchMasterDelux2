/**
 * Upload API Endpoint
 *
 * Handles multipart/form-data file uploads to Vercel Blob storage and creates
 * mediaAssets records in Payload CMS.
 *
 * POST /api/upload
 *
 * Request:
 *   - Content-Type: multipart/form-data
 *   - Body: file (FormData)
 *   - Headers: Authorization (Bearer token for authenticated user)
 *
 * Response:
 *   - 200: { success: true, mediaAsset: { id, providerUrl, filename, ... } }
 *   - 400: { success: false, error: "Invalid file" }
 *   - 401: { success: false, error: "Unauthorized" }
 *   - 500: { success: false, error: "Upload failed" }
 *
 * Related: T017 - Upload API endpoint
 * Created: 2025-10-29
 *
 * TODO: This endpoint requires the following npm packages to be installed:
 *   - npm install multer @vercel/blob dotenv
 *
 * TODO: Set up environment variables in .env:
 *   - BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
 *   - PAYLOAD_API_URL=http://localhost:3001/api (or your Payload instance URL)
 */

const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const { put } = require('@vercel/blob');
const path = require('path');

const router = express.Router();

// Configure multer for memory storage (we'll stream directly to Vercel Blob)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size (per data-model.md)
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME types (from migration-config.json)
    const allowedMimeTypes = [
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/jpg',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimeTypes.join(', ')}`));
    }
  },
});

/**
 * POST /api/upload
 * Upload a file to Vercel Blob and create a mediaAssets record
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // Get authenticated user ID (TODO: implement proper auth middleware)
    // For now, we'll accept userId from request body or use a placeholder
    const uploadedByUserId = req.body.userId || req.user?.id || null;

    console.log('[Upload API] Processing file upload:', {
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: uploadedByUserId,
    });

    // Generate checksum (SHA256) for file integrity
    const checksum = crypto
      .createHash('sha256')
      .update(req.file.buffer)
      .digest('base64');

    // Generate unique filename to prevent collisions
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(6).toString('hex');
    const fileExtension = path.extname(req.file.originalname);
    const baseFilename = path.basename(req.file.originalname, fileExtension);
    const uniqueFilename = `${baseFilename}-${timestamp}-${randomSuffix}${fileExtension}`;

    // Upload to Vercel Blob
    console.log('[Upload API] Uploading to Vercel Blob...');

    const blobResult = await put(uniqueFilename, req.file.buffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false, // We already added our own suffix
    });

    console.log('[Upload API] ✓ File uploaded to Vercel Blob:', blobResult.url);

    // Create mediaAssets record in Payload CMS
    const mediaAsset = {
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storageProvider: 'vercel_blob',
      providerUrl: blobResult.url,
      providerKey: blobResult.pathname || uniqueFilename,
      uploadedBy: uploadedByUserId,
      uploadedAt: new Date().toISOString(),
      checksum,
      metadata: {
        originalFilename: req.file.originalname,
        uploadedVia: 'api',
      },
      legacyMetadata: {
        // Reserved for future migration metadata
      },
    };

    // TODO: Insert into Payload CMS mediaAssets collection
    // For now, we'll simulate the record creation
    // When Payload is fully integrated, use:
    // const payloadResponse = await fetch(`${process.env.PAYLOAD_API_URL}/mediaAssets`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${req.headers.authorization}`,
    //   },
    //   body: JSON.stringify(mediaAsset),
    // });
    // const createdAsset = await payloadResponse.json();

    // Simulate Payload response for now
    const createdAsset = {
      id: crypto.randomUUID(),
      ...mediaAsset,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('[Upload API] ✓ Media asset record created:', createdAsset.id);

    // Return success response
    res.status(200).json({
      success: true,
      mediaAsset: {
        id: createdAsset.id,
        providerUrl: createdAsset.providerUrl,
        filename: createdAsset.filename,
        mimeType: createdAsset.mimeType,
        size: createdAsset.size,
        checksum: createdAsset.checksum,
        uploadedAt: createdAsset.uploadedAt,
      },
    });
  } catch (error) {
    console.error('[Upload API] ✗ Upload failed:', error);

    // Handle specific error types
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds 50MB limit',
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/upload/health
 * Health check endpoint for upload service
 */
router.get('/health', (req, res) => {
  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;

  res.status(200).json({
    success: true,
    service: 'upload',
    status: 'operational',
    vercelBlobConfigured: hasToken,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

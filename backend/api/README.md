# Backend API

This directory contains the Express.js API endpoints for CatchMaster Delux.

## Available Endpoints

### Upload API (`/api/upload`)

Handles file uploads to Vercel Blob storage and creates mediaAssets records in Payload CMS.

**Endpoint:** `POST /api/upload`

**Request:**
- Content-Type: `multipart/form-data`
- Body: `file` (the file to upload)
- Optional: `userId` (if not using auth middleware)

**Response (Success - 200):**
```json
{
  "success": true,
  "mediaAsset": {
    "id": "uuid",
    "providerUrl": "https://...",
    "filename": "example.png",
    "mimeType": "image/png",
    "size": 12345,
    "checksum": "base64-sha256-hash",
    "uploadedAt": "2025-10-29T..."
  }
}
```

**Response (Error - 400/401/500):**
```json
{
  "success": false,
  "error": "Error message"
}
```

**Supported File Types:**
- image/png
- image/jpeg
- image/jpg
- image/gif
- image/webp
- image/svg+xml

**Max File Size:** 50MB

#### Health Check

**Endpoint:** `GET /api/upload/health`

**Response:**
```json
{
  "success": true,
  "service": "upload",
  "status": "operational",
  "vercelBlobConfigured": true,
  "timestamp": "2025-10-29T..."
}
```

## Setup

### 1. Install Dependencies

```bash
npm install multer @vercel/blob dotenv
```

### 2. Configure Environment Variables

Copy [.env.example](../../.env.example) to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `BLOB_READ_WRITE_TOKEN` - Get from [Vercel Blob Storage](https://vercel.com/docs/storage/vercel-blob/quickstart)
- `PAYLOAD_API_URL` - Your Payload CMS API endpoint

### 3. Start the Server

```bash
npm run server
```

The upload API will be available at `http://localhost:3000/api/upload`

## Testing

### Using cURL

```bash
# Upload a file
curl -X POST http://localhost:3000/api/upload \
  -F "file=@path/to/image.png" \
  -F "userId=user-123"

# Check health
curl http://localhost:3000/api/upload/health
```

### Using Postman

1. Create a new POST request to `http://localhost:3000/api/upload`
2. Select Body → form-data
3. Add a key named `file` with type `File`
4. Select your file
5. Optionally add `userId` as a text field
6. Send the request

## Architecture

```
┌─────────────┐
│   Client    │
│  (React)    │
└──────┬──────┘
       │ multipart/form-data
       ▼
┌─────────────┐
│   Express   │
│   Server    │
│  app.js     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Upload    │
│   API       │
│  upload.js  │
└──┬────┬─────┘
   │    │
   │    │ Create record
   │    ▼
   │ ┌─────────────┐
   │ │  Payload    │
   │ │   CMS       │
   │ └─────────────┘
   │
   │ Upload file
   ▼
┌─────────────┐
│   Vercel    │
│    Blob     │
└─────────────┘
```

## TODOs

- [ ] Implement proper authentication middleware
- [ ] Integrate with actual Payload CMS API (currently simulated)
- [ ] Add rate limiting to prevent abuse
- [ ] Add file deduplication (check checksum before upload)
- [ ] Add progress tracking for large files
- [ ] Implement batch upload support
- [ ] Add image optimization/resizing
- [ ] Add virus scanning for uploaded files

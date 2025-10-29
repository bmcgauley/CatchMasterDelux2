# Client Services

This directory contains service modules that handle API communication and business logic for the client application.

## Available Services

### Upload Service (`upload.js`)

Handles file uploads to the backend API with progress tracking and error handling.

#### Functions

##### `uploadFile(file, options)`

Upload a file to the server.

**Parameters:**
- `file` (File): File object from input element
- `options` (Object):
  - `userId` (string): User ID (optional)
  - `onProgress` (Function): Progress callback (0-100)
  - `signal` (AbortSignal): For cancellation support

**Returns:** Promise<Object> - Media asset data

**Example:**
```javascript
import { uploadFile } from '../services/upload';

const file = event.target.files[0];

try {
  const mediaAsset = await uploadFile(file, {
    userId: 'user-123',
    onProgress: (progress) => {
      console.log(`Upload progress: ${progress}%`);
    },
  });

  console.log('Upload successful:', mediaAsset);
  // {
  //   id: 'uuid',
  //   providerUrl: 'https://...',
  //   filename: 'example.png',
  //   mimeType: 'image/png',
  //   size: 12345,
  //   checksum: 'sha256-hash',
  //   uploadedAt: '2025-10-29T...'
  // }
} catch (error) {
  console.error('Upload failed:', error.message);
}
```

##### `validateFile(file)`

Validate a file before upload.

**Parameters:**
- `file` (File): File to validate

**Returns:** Object - `{ valid: boolean, error?: string }`

**Example:**
```javascript
import { validateFile } from '../services/upload';

const validation = validateFile(file);
if (!validation.valid) {
  alert(validation.error);
  return;
}
```

##### `formatFileSize(bytes)`

Format file size for display.

**Parameters:**
- `bytes` (number): File size in bytes

**Returns:** string - Formatted size (e.g., "2.5 MB")

**Example:**
```javascript
import { formatFileSize } from '../services/upload';

console.log(formatFileSize(1024)); // "1 KB"
console.log(formatFileSize(1536000)); // "1.46 MB"
```

##### `getUploadHealth()`

Check upload service health status.

**Returns:** Promise<Object> - Health status

**Example:**
```javascript
import { getUploadHealth } from '../services/upload';

const health = await getUploadHealth();
console.log(health.status); // 'operational'
console.log(health.vercelBlobConfigured); // true
```

## File Constraints

- **Max file size:** 50MB
- **Allowed types:**
  - image/png
  - image/jpeg
  - image/jpg
  - image/gif
  - image/webp
  - image/svg+xml

## Error Handling

The upload service provides user-friendly error messages:

- File too large: "File size exceeds 50MB limit. Your file is X MB."
- Invalid type: "Invalid file type: X. Allowed types: PNG, JPEG, GIF, WebP, SVG."
- Network error: "Network error during upload"
- Cancelled: "Upload cancelled"

## Environment Variables

Set in `.env` file:

```bash
# API endpoint (defaults to http://localhost:3000)
REACT_APP_API_URL=http://localhost:3000
```

## Related Components

- [UploadButton](../components/UploadButton.js) - UI component for file uploads
- [UploadButton Example](../components/UploadButton.example.js) - Usage examples

## Future Services

- `auth.js` - Authentication service (Firebase/Supabase)
- `games.js` - Game collection management
- `pokemon.js` - Pokemon data and Pokedex
- `progress.js` - Progress tracking

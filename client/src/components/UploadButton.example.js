/**
 * UploadButton Usage Example
 *
 * This file demonstrates how to use the UploadButton component in your pages.
 * Copy and adapt this code to integrate file uploads in your application.
 *
 * Related: T020 - Frontend upload flow
 * Created: 2025-10-29
 */

import React, { useState } from 'react';
import UploadButton from './UploadButton';

export default function UploadExample() {
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const handleUploadSuccess = (mediaAsset) => {
    console.log('Upload successful:', mediaAsset);

    // Add to list of uploaded files
    setUploadedFiles((prev) => [...prev, mediaAsset]);

    // You can also:
    // - Update game instance with new media
    // - Refresh Pokemon box
    // - Show success notification
    // - Update user avatar
  };

  const handleUploadError = (error) => {
    console.error('Upload failed:', error);

    // You can also:
    // - Show toast notification
    // - Log error to monitoring service
    // - Display user-friendly error message
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h1>File Upload Example</h1>

      {/* Basic Upload Button */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Basic Upload</h2>
        <UploadButton
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          userId="user-123" // Replace with actual user ID from auth
        />
      </section>

      {/* Custom Styled Upload Button */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Custom Styled Upload</h2>
        <UploadButton
          onUploadSuccess={handleUploadSuccess}
          onUploadError={handleUploadError}
          buttonText="Upload Pokemon Sprite"
          showPreview={true}
          className="custom-upload"
        />
      </section>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <section style={{ marginTop: '40px' }}>
          <h2>Uploaded Files</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {uploadedFiles.map((file, index) => (
              <li
                key={file.id || index}
                style={{
                  padding: '10px',
                  margin: '10px 0',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <img
                  src={file.providerUrl}
                  alt={file.filename}
                  style={{
                    width: '50px',
                    height: '50px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <strong>{file.filename}</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    {file.mimeType} • {Math.round(file.size / 1024)} KB
                  </small>
                </div>
                <a
                  href={file.providerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontSize: '0.875rem',
                  }}
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/**
 * Integration Examples
 */

// Example 1: Avatar Upload
export function AvatarUploadExample({ userId, currentAvatar, onAvatarUpdate }) {
  return (
    <div>
      <h3>Update Avatar</h3>
      {currentAvatar && (
        <img
          src={currentAvatar}
          alt="Current avatar"
          style={{ width: '100px', height: '100px', borderRadius: '50%' }}
        />
      )}
      <UploadButton
        onUploadSuccess={(mediaAsset) => {
          // Update user profile with new avatar
          onAvatarUpdate(mediaAsset.providerUrl);
        }}
        userId={userId}
        buttonText="Change Avatar"
        showPreview={true}
      />
    </div>
  );
}

// Example 2: Game Box Screenshot Upload
export function BoxScreenshotUpload({ gameInstanceId, userId }) {
  return (
    <div>
      <h3>Upload Box Screenshot</h3>
      <UploadButton
        onUploadSuccess={(mediaAsset) => {
          // Associate media with game instance
          console.log(`Uploading screenshot for game ${gameInstanceId}`);
          // TODO: Call API to update game instance with media reference
        }}
        userId={userId}
        buttonText="Upload Screenshot"
      />
    </div>
  );
}

// Example 3: Multiple File Upload
export function MultipleFileUpload({ userId }) {
  const [files, setFiles] = useState([]);

  return (
    <div>
      <h3>Upload Multiple Files</h3>
      <p>Upload files one at a time:</p>
      <UploadButton
        onUploadSuccess={(mediaAsset) => {
          setFiles((prev) => [...prev, mediaAsset]);
        }}
        userId={userId}
        buttonText="Add File"
        showPreview={false}
      />
      <p>Uploaded: {files.length} files</p>
    </div>
  );
}

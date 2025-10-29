/**
 * UploadButton Component
 *
 * A reusable file upload button with progress tracking and error handling.
 * Supports drag-and-drop and click-to-upload interactions.
 *
 * Features:
 * - File validation (type and size)
 * - Upload progress indicator
 * - Error messages
 * - Cancel upload
 * - Preview uploaded file
 *
 * Related: T020 - Frontend upload flow
 * Created: 2025-10-29
 */

import React, { useState, useRef } from 'react';
import { uploadFile, validateFile, formatFileSize } from '../services/upload';

/**
 * UploadButton Component
 *
 * @param {Object} props
 * @param {Function} props.onUploadSuccess - Callback when upload succeeds (mediaAsset)
 * @param {Function} [props.onUploadError] - Callback when upload fails (error)
 * @param {string} [props.userId] - User ID for the upload
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.buttonText] - Custom button text
 * @param {boolean} [props.showPreview] - Show preview after upload
 */
export default function UploadButton({
  onUploadSuccess,
  onUploadError,
  userId,
  className = '',
  buttonText = 'Upload File',
  showPreview = true,
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedAsset, setUploadedAsset] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Reset state
    setError(null);
    setUploadedAsset(null);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      if (onUploadError) {
        onUploadError(new Error(validation.error));
      }
      return;
    }

    // Start upload
    setUploading(true);
    setProgress(0);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const mediaAsset = await uploadFile(file, {
        userId,
        onProgress: (uploadProgress) => {
          setProgress(uploadProgress);
        },
        signal: abortControllerRef.current.signal,
      });

      // Upload successful
      setUploadedAsset(mediaAsset);
      setUploading(false);
      setProgress(100);

      if (onUploadSuccess) {
        onUploadSuccess(mediaAsset);
      }
    } catch (err) {
      // Upload failed
      setError(err.message || 'Upload failed');
      setUploading(false);
      setProgress(0);

      if (onUploadError) {
        onUploadError(err);
      }
    }
  };

  const handleFileInputChange = (event) => {
    const file = event.target.files[0];
    handleFileSelect(file);
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else if (event.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    const file = event.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploading(false);
    setProgress(0);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`upload-button-container ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      {/* Upload area */}
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={!uploading ? handleButtonClick : undefined}
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          cursor: uploading ? 'default' : 'pointer',
          backgroundColor: dragActive ? '#f0f0f0' : 'transparent',
          transition: 'all 0.3s ease',
        }}
      >
        {!uploading && !uploadedAsset && (
          <div>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ margin: '0 auto 10px' }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ margin: '10px 0' }}>
              <strong>{buttonText}</strong>
            </p>
            <p style={{ fontSize: '0.875rem', color: '#666', margin: '5px 0' }}>
              or drag and drop
            </p>
            <p style={{ fontSize: '0.75rem', color: '#999', margin: '5px 0' }}>
              PNG, JPEG, GIF, WebP, SVG (max 50MB)
            </p>
          </div>
        )}

        {uploading && (
          <div>
            <div style={{ margin: '10px 0' }}>
              <div
                style={{
                  width: '100%',
                  height: '8px',
                  backgroundColor: '#e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: '100%',
                    backgroundColor: '#4CAF50',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <p style={{ margin: '10px 0', fontSize: '0.875rem' }}>
                Uploading... {progress}%
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Cancel
            </button>
          </div>
        )}

        {uploadedAsset && showPreview && (
          <div>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4CAF50"
              strokeWidth="2"
              style={{ margin: '0 auto 10px' }}
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p style={{ margin: '10px 0', color: '#4CAF50' }}>
              <strong>Upload successful!</strong>
            </p>
            <p style={{ fontSize: '0.875rem', color: '#666', margin: '5px 0' }}>
              {uploadedAsset.filename} ({formatFileSize(uploadedAsset.size)})
            </p>
            {uploadedAsset.providerUrl && (
              <img
                src={uploadedAsset.providerUrl}
                alt={uploadedAsset.filename}
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  margin: '10px auto',
                  borderRadius: '4px',
                }}
              />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUploadedAsset(null);
                setProgress(0);
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                marginTop: '10px',
              }}
            >
              Upload Another
            </button>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#ffebee',
            color: '#c62828',
            borderRadius: '4px',
            fontSize: '0.875rem',
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}

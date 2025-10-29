/**
 * MediaAssets Collection
 *
 * Stores metadata for all media assets (images, sprites, covers, etc.)
 * uploaded to the application. Files are stored in Vercel Blob or Supabase
 * with references maintained here.
 *
 * Related to: T007 [US2] - Media storage migration
 */

const MediaAssets = {
  slug: 'media-assets',
  labels: {
    singular: 'Media Asset',
    plural: 'Media Assets',
  },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'mimeType', 'size', 'storageProvider', 'uploadedAt'],
    group: 'Media',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => !!user,
    delete: ({ req: { user } }) => !!user,
  },
  fields: [
    {
      name: 'filename',
      type: 'text',
      required: true,
      label: 'Filename',
      admin: {
        description: 'Original filename of the uploaded asset',
      },
    },
    {
      name: 'mimeType',
      type: 'text',
      required: true,
      label: 'MIME Type',
      admin: {
        description: 'File MIME type (e.g., image/png, image/jpeg)',
      },
    },
    {
      name: 'size',
      type: 'number',
      required: true,
      label: 'File Size (bytes)',
      admin: {
        description: 'File size in bytes',
      },
    },
    {
      name: 'storageProvider',
      type: 'select',
      required: true,
      label: 'Storage Provider',
      options: [
        { label: 'Vercel Blob', value: 'vercel-blob' },
        { label: 'Supabase', value: 'supabase' },
        { label: 'Firebase (Legacy)', value: 'firebase-legacy' },
      ],
      defaultValue: 'vercel-blob',
      admin: {
        description: 'Where the file is stored',
      },
    },
    {
      name: 'providerUrl',
      type: 'text',
      required: true,
      label: 'Provider URL',
      admin: {
        description: 'Full URL to access the asset from the storage provider',
      },
    },
    {
      name: 'providerKey',
      type: 'text',
      label: 'Provider Key',
      admin: {
        description: 'Storage provider-specific key or path (e.g., blob key, bucket path)',
      },
    },
    {
      name: 'checksum',
      type: 'text',
      label: 'Checksum (SHA-256)',
      admin: {
        description: 'SHA-256 checksum for verifying file integrity',
      },
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Uploaded By',
      admin: {
        description: 'User who uploaded this asset',
      },
    },
    {
      name: 'uploadedAt',
      type: 'date',
      required: true,
      label: 'Uploaded At',
      defaultValue: () => new Date(),
      admin: {
        description: 'Timestamp when the asset was uploaded',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },
    {
      name: 'metadata',
      type: 'json',
      label: 'Metadata',
      admin: {
        description: 'Additional metadata (dimensions, alt text, etc.)',
      },
    },
    {
      name: 'legacyMetadata',
      type: 'json',
      label: 'Legacy Metadata',
      admin: {
        description: 'Metadata from original Firebase storage (for migrated assets)',
      },
    },
  ],
  timestamps: true,
};

module.exports = MediaAssets;

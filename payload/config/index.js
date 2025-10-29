/**
 * Payload CMS Configuration
 *
 * Main configuration file for Payload CMS. Wires together collections,
 * storage adapters, and authentication.
 *
 * Related to: T010 - Storage adapter integration
 */

const { buildConfig } = require('payload/config');
const path = require('path');
const { createStorageAdapter } = require('./storage');

// Import collections
const Users = require('../collections/users');
const MediaAssets = require('../collections/mediaAssets');
const GameInstances = require('../collections/gameInstances');

module.exports = buildConfig({
  serverURL: process.env.PAYLOAD_SERVER_URL || 'http://localhost:3001',

  // Admin panel configuration
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '- CatchMaster Delux',
      favicon: '/favicon.ico',
    },
  },

  // Collections
  collections: [
    Users,
    MediaAssets,
    GameInstances,
  ],

  // Database configuration (PostgreSQL recommended)
  db: {
    // Adapter will be configured based on DATABASE_URL
    // Example: postgres://user:password@host:port/database
    connectionString: process.env.DATABASE_URL,
  },

  // TypeScript configuration (optional, can be enabled later)
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },

  // GraphQL configuration (optional)
  graphQL: {
    schemaOutputFile: path.resolve(__dirname, 'generated-schema.graphql'),
  },

  // Storage plugins
  plugins: [
    createStorageAdapter(),
  ],

  // CORS configuration
  cors: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    process.env.PAYLOAD_SERVER_URL || 'http://localhost:3001',
  ].filter(Boolean),

  // CSRF protection
  csrf: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    process.env.PAYLOAD_SERVER_URL || 'http://localhost:3001',
  ].filter(Boolean),

  // Rate limiting
  rateLimit: {
    max: 100,
    window: 15 * 60 * 1000, // 15 minutes
  },

  // File upload limits
  upload: {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB default, configurable per collection
    },
  },
});

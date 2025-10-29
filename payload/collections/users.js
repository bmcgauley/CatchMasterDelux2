/**
 * Users Collection
 *
 * Stores user account information. This collection bridges authentication
 * providers (Firebase Auth, Supabase Auth) with application data.
 *
 * Related to: T008 [US1] - User data migration
 */

const Users = {
  slug: 'users',
  labels: {
    singular: 'User',
    plural: 'Users',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'displayName', 'lastActiveAt'],
    group: 'Users',
  },
  auth: {
    // Enable authentication features if needed
    // This can be configured based on whether Payload handles auth directly
    // or if we use external providers (Firebase/Supabase)
  },
  access: {
    // Users can read their own data
    read: ({ req: { user } }) => {
      if (!user) return false;
      // Admins can read all, users can read their own
      return user.admin ? true : { id: { equals: user.id } };
    },
    create: () => true, // Allow registration
    update: ({ req: { user } }) => {
      if (!user) return false;
      // Admins can update all, users can update their own
      return user.admin ? true : { id: { equals: user.id } };
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      return user.admin; // Only admins can delete
    },
  },
  fields: [
    {
      name: 'authUid',
      type: 'text',
      label: 'Auth Provider UID',
      unique: true,
      admin: {
        description: 'Unique identifier from authentication provider (Firebase/Supabase)',
      },
    },
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      label: 'Email Address',
      admin: {
        description: 'User email address',
      },
    },
    {
      name: 'displayName',
      type: 'text',
      label: 'Display Name',
      admin: {
        description: 'User display name or username',
      },
    },
    {
      name: 'avatar',
      type: 'relationship',
      relationTo: 'media-assets',
      label: 'Avatar',
      admin: {
        description: 'User profile avatar image',
      },
    },
    {
      name: 'lastActiveAt',
      type: 'date',
      label: 'Last Active',
      admin: {
        description: 'Last time the user was active in the application',
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
    },
    {
      name: 'preferences',
      type: 'json',
      label: 'User Preferences',
      admin: {
        description: 'User preferences and settings (theme, notifications, etc.)',
      },
    },
    {
      name: 'legacyMetadata',
      type: 'json',
      label: 'Legacy Metadata',
      admin: {
        description: 'Metadata from original Firebase user records (for migrated users)',
      },
    },
    {
      name: 'admin',
      type: 'checkbox',
      label: 'Admin',
      defaultValue: false,
      admin: {
        description: 'Grant administrative privileges',
      },
    },
  ],
  timestamps: true,
};

module.exports = Users;

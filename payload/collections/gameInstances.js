/**
 * GameInstances Collection
 *
 * Stores individual game instances owned by users. Each instance represents
 * a specific Pokemon game with progress, Pokemon collection, and metadata.
 *
 * Related to: T009 [US1] - Game instance data migration
 */

const GameInstances = {
  slug: 'game-instances',
  labels: {
    singular: 'Game Instance',
    plural: 'Game Instances',
  },
  admin: {
    useAsTitle: 'gameId',
    defaultColumns: ['gameId', 'user', 'createdAt', 'updatedAt'],
    group: 'Games',
  },
  access: {
    // Users can read their own game instances
    read: ({ req: { user } }) => {
      if (!user) return false;
      // Admins can read all, users can read their own
      return user.admin ? true : { user: { equals: user.id } };
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false;
      // Admins can update all, users can update their own
      return user.admin ? true : { user: { equals: user.id } };
    },
    delete: ({ req: { user } }) => {
      if (!user) return false;
      // Admins can delete all, users can delete their own
      return user.admin ? true : { user: { equals: user.id } };
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Owner',
      admin: {
        description: 'User who owns this game instance',
      },
    },
    {
      name: 'gameId',
      type: 'text',
      required: true,
      label: 'Game ID',
      admin: {
        description: 'Pokemon game identifier (e.g., "red", "gold", "ruby", "diamond")',
      },
    },
    {
      name: 'gameName',
      type: 'text',
      label: 'Game Name',
      admin: {
        description: 'Human-readable game name (e.g., "Pokemon Red", "Pokemon Gold")',
      },
    },
    {
      name: 'generation',
      type: 'number',
      label: 'Generation',
      min: 1,
      max: 9,
      admin: {
        description: 'Pokemon generation (1-9)',
      },
    },
    {
      name: 'state',
      type: 'json',
      label: 'Game State',
      admin: {
        description: 'Complete game state including Pokemon, boxes, party, badges, progress',
      },
    },
    {
      name: 'pokemonData',
      type: 'json',
      label: 'Pokemon Data',
      admin: {
        description: 'Structured Pokemon collection data (caught, seen, shiny, etc.)',
      },
    },
    {
      name: 'pokedexCompletion',
      type: 'number',
      label: 'Pokedex Completion %',
      min: 0,
      max: 100,
      admin: {
        description: 'Percentage of Pokedex completed',
      },
    },
    {
      name: 'badges',
      type: 'array',
      label: 'Gym Badges',
      fields: [
        {
          name: 'badgeName',
          type: 'text',
          label: 'Badge Name',
        },
        {
          name: 'obtained',
          type: 'checkbox',
          label: 'Obtained',
          defaultValue: false,
        },
      ],
      admin: {
        description: 'Gym badges collected in this game',
      },
    },
    {
      name: 'condition',
      type: 'select',
      label: 'Physical Condition',
      options: [
        { label: 'Mint', value: 'mint' },
        { label: 'Excellent', value: 'excellent' },
        { label: 'Good', value: 'good' },
        { label: 'Fair', value: 'fair' },
        { label: 'Poor', value: 'poor' },
        { label: 'Digital', value: 'digital' },
      ],
      admin: {
        description: 'Physical condition of the game cartridge/disc',
      },
    },
    {
      name: 'purchaseDate',
      type: 'date',
      label: 'Purchase Date',
      admin: {
        description: 'Date when the game was purchased',
      },
    },
    {
      name: 'purchasePrice',
      type: 'number',
      label: 'Purchase Price',
      admin: {
        description: 'Purchase price in USD',
      },
    },
    {
      name: 'coverImage',
      type: 'relationship',
      relationTo: 'media-assets',
      label: 'Cover Image',
      admin: {
        description: 'Game cover or box art',
      },
    },
    {
      name: 'legacyMetadata',
      type: 'json',
      label: 'Legacy Metadata',
      admin: {
        description: 'Metadata from original Firebase game records (for migrated instances)',
      },
    },
  ],
  timestamps: true,
  indexes: [
    {
      fields: ['user', 'gameId'],
      unique: false,
    },
  ],
};

module.exports = GameInstances;

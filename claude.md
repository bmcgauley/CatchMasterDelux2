# CatchMaster Delux - Pokemon Tracker Platform

## Project Overview

CatchMaster Delux is a comprehensive Pokemon tracking platform that enables users to manage and track their progress across multiple Pokemon games from all generations. The platform provides tools for game collection management, Pokemon box organization, Pokedex completion tracking, and overall progress monitoring.

### Purpose
- Track Pokemon game collections and ownership details
- Manage Pokemon boxes and party members for each game
- Monitor Pokedex completion across individual games and globally
- Track game progress including gym badges and special events
- Provide a centralized dashboard for overall Pokemon gaming progress

## Tech Stack

### Backend
- **Node.js** with **Express.js** - Server framework
- **EJS** - Server-side templating engine for views
- Port: 3000 (default)

### Frontend
- **React 18.3.1** - UI framework
- **React Router DOM 6.27.0** - Client-side routing
- **Lucide React 0.452.0** - Icon library
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing

### Database & Authentication
- **Firebase** - Authentication service
- **Firestore** - NoSQL cloud database for user data, game instances, and progress

### External APIs
- **PokeAPI** (https://pokeapi.co/api/v2/) - Pokemon data, sprites, and game information

### Development Tools
- **Axios 0.21.1** - HTTP client for API requests
- **Concurrently 6.2.0** - Run multiple commands simultaneously
- **Nodemon 2.0.15** - Auto-restart server during development

## Architecture

### MVC (Model-View-Controller) Pattern
- **Models**: Define data structures (User, Game, Pokemon)
- **Views**: React components and EJS templates
- **Controllers**: Business logic for handling requests (userController, gameController, pokemonController)

### Project Structure
```
CatchMasterDelux2/
├── .claude/              # Claude Code configuration
│   ├── init/            # Initialization scripts
│   └── claude.md        # This file
├── client/              # React frontend application
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   │   ├── ui/     # UI component library
│   │   │   ├── AuthPage.js
│   │   │   ├── Button.js
│   │   │   ├── Footer.js
│   │   │   ├── Header.js
│   │   │   ├── Layout.js
│   │   │   └── MainApp.js
│   │   ├── pages/      # Page components
│   │   │   ├── Dashboard.js
│   │   │   ├── Games.js
│   │   │   ├── Pokedex.js
│   │   │   └── Progress.js
│   │   ├── firebase/   # Firebase configuration
│   │   ├── App.js
│   │   └── index.js
│   ├── build/          # Production build output
│   └── package.json
├── public/             # Server static assets
├── views/              # EJS templates (if used)
├── app.js              # Express server entry point
└── package.json

Planned structure (from README):
├── config/             # Configuration files
│   └── firebase.js
├── controllers/        # Route controllers
│   ├── gameController.js
│   ├── pokemonController.js
│   └── userController.js
├── models/            # Data models
│   ├── Game.js
│   ├── Pokemon.js
│   └── User.js
├── routes/            # Express routes
│   ├── gameRoutes.js
│   ├── pokemonRoutes.js
│   └── userRoutes.js
├── services/          # External service integrations
│   ├── firebaseService.js
│   └── pokeApiService.js
└── utils/             # Utility functions
    ├── cacheUtils.js
    └── helpers.js
```

## Core Features

### 1. User Authentication
- Firebase Authentication for user registration and login
- User profile management
- Protected routes for authenticated users

### 2. Game Management
- Browse all available Pokemon games from all generations
- Add games to personal collection with details:
  - Game condition
  - Purchase date
  - Purchase price
- View owned game instances
- Manage game collection (edit/delete instances)
- Navigate to game-specific tracking features

### 3. Pokemon Box System (Pokebox)
- View Pokemon in boxes organized by Pokedex order
- Navigate between multiple boxes (30 Pokemon per box)
- Track individual Pokemon status:
  - Unseen
  - Seen
  - Caught
  - Shiny variant
- Living Dex tracking options:
  - Standard Living Dex
  - Living Form Dex
  - Other variants
- Pokemon detail panel with comprehensive information
- Party management (move Pokemon to/from party)
- Level tracking (level up/down)
- Release caught Pokemon

### 4. Pokedex Tracking
- Game-specific Pokedex completion percentage
- Overall Pokedex completion across all games
- Mark Pokemon as caught, seen, or unseen
- Display Pokemon sprites (normal and shiny)
- Filter and search Pokemon

### 5. Progress Tracking
- Individual game completion percentage
- Overall completion across all games
- Milestone tracking (gym badges, special events)
- Dashboard with quick stats and recent activities

### 6. Data Synchronization
- Real-time syncing with Firestore
- Local storage caching for frequently accessed data
- Offline functionality for basic features
- Automatic sync when connection restored

## Development Workflow

### Setup & Installation
```bash
# Install dependencies
npm install

# Install client dependencies
cd client && npm install

# Development mode (runs both server and client)
npm run dev

# Run server only (with auto-restart)
npm run server

# Run client only
npm run client

# Build production client
npm run build

# Start production server
npm start
```

### Environment Variables
Create a `.env` file in the root directory:
```
PORT=3000
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### Development Scripts
- `npm run dev` - Start both server and client in development mode
- `npm run server` - Start Express server with nodemon
- `npm run client` - Start React development server
- `npm run build` - Build React app for production

## Project-Specific Conventions

### Code Organization
1. **Components**: Place all React components in `client/src/components/`
   - UI components go in `client/src/components/ui/`
   - Page components go in `client/src/pages/`
   - Component naming: PascalCase (e.g., `AuthPage.js`, `MainApp.js`)

2. **Controllers**: Business logic for handling routes
   - Named with Controller suffix (e.g., `gameController.js`)
   - Keep controllers focused on single responsibility

3. **Services**: External API and database interactions
   - `firebaseService.js` - All Firestore operations
   - `pokeApiService.js` - PokéAPI data fetching

4. **Models**: Data structure definitions
   - Define schemas for User, Game, Pokemon entities
   - Include validation logic

### Data Flow
1. **Client Request** → React Component
2. **API Call** → Express Route
3. **Controller** → Processes request, calls services
4. **Service** → Interacts with Firebase/PokéAPI
5. **Response** → Sent back through the chain
6. **State Update** → React component re-renders

### Caching Strategy
- Cache PokéAPI responses locally to reduce API calls
- Store Pokemon sprites and game data in localStorage
- Implement cache invalidation for stale data
- Use Firestore for user-specific data persistence

### API Integration Best Practices

#### PokéAPI
```javascript
// Example: Fetch Pokemon data
const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu');
const data = await response.json();

// Key data fields:
// - id: Pokemon number
// - name: Pokemon name
// - sprites: Image URLs (front_default, front_shiny)
// - types: Type information
// - stats: Base stats
```

#### Firebase/Firestore
```javascript
// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Add document
import { collection, addDoc } from "firebase/firestore";
await addDoc(collection(db, "users"), { userData });

// Read documents
import { collection, getDocs } from "firebase/firestore";
const querySnapshot = await getDocs(collection(db, "users"));

// Update document
import { doc, updateDoc } from "firebase/firestore";
await updateDoc(doc(db, "users", userId), { field: value });
```

### Naming Conventions
- **Files**: camelCase for JS files (e.g., `gameController.js`)
- **React Components**: PascalCase (e.g., `Dashboard.js`)
- **Functions**: camelCase (e.g., `fetchPokemonData()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_POKEMON_PER_BOX`)
- **Routes**: kebab-case (e.g., `/api/game-instances`)

### Error Handling
- Implement try-catch blocks for all async operations
- Log errors server-side for debugging
- Display user-friendly error messages on client
- Handle network failures gracefully with retry logic

### State Management
- Use React Context API for global state
- Consider Redux if state management becomes complex
- Keep component state local when possible
- Use React hooks (useState, useEffect, useContext)

### Testing Strategy
- Unit tests for critical functions and components
- Integration tests for API endpoints
- Use Jest and React Testing Library
- Test authentication flows thoroughly
- Mock external API calls in tests

### Performance Optimization
- Implement lazy loading for routes and components
- Use React.memo for expensive component renders
- Optimize Firestore queries with proper indexing
- Cache Pokemon sprites and data locally
- Implement virtual scrolling for large Pokemon lists
- Compress images and assets

### Accessibility Guidelines
- Ensure keyboard navigation support
- Use proper ARIA attributes
- Maintain color contrast ratios
- Provide alt text for images
- Test with screen readers
- Support responsive design for all screen sizes

## Additional Considerations

### Security
- Never expose Firebase credentials in client code
- Use environment variables for sensitive data
- Implement proper authentication middleware
- Validate all user inputs server-side
- Use HTTPS in production

### Deployment
- Backend: Deploy to Heroku, DigitalOcean, or similar Node.js platform
- Frontend: Deploy to Netlify, Vercel, or serve from Express
- Set environment variables in deployment platform
- Enable CI/CD pipeline for automated deployments
- Monitor application performance and errors

### Future Enhancements
- Trading system between users
- Social features (friends, sharing progress)
- Battle team builder
- Achievement system
- Mobile app (React Native)
- Competitive tracking (leaderboards)
- Event Pokemon tracking
- Shiny hunting statistics

## Resources & Documentation

### Official Documentation
- [PokeAPI Docs](https://pokeapi.co/docs/v2)
- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Express.js Docs](https://expressjs.com/)
- [React Docs](https://react.dev/)
- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### Key Libraries
- Axios: HTTP client for API requests
- EJS: Templating engine for server-rendered views
- Lucide React: Icon library

## Workflow Guardrails

### GitHub Workflow Pattern
When working on this project, follow this strict workflow pattern:

1. **Complete Task**: Finish the current task completely
2. **Stage Changes**: Stage all changes related to the task (`git add`)
3. **Mark Task Complete**: Update the task status (via gh issues CLI)
4. **Check Milestone**: Determine if current work represents a major milestone in spec or phase
5. **Create PR if Milestone**: If at a major milestone, create an official PR back to master. IMPORTANT: Only merge back to master after conducting `/security-audit` and addressing any high/critical findings reported by that audit.
6. **Move to Next Task**: Proceed to the next task only after completing the above steps

### Branch Strategy
- **Feature Branches**: Work on feature-specific branches (e.g., `feature/auth-system`)
- **Phase Branches**: Work on phase-specific branches (e.g., `phase-1-foundation`)
- **Never commit directly to master**: All work must go through feature/phase branches
- **PR to Master**: Only merge to master at major milestones or phase completions

### Task Management
- **Use GitHub Issues CLI**: Manage all tasks via `gh issue` commands
- **Create Issues**: Create issues for each major task or feature
- **Update Status**: Update issue status as you progress (open → in-progress → closed)
- **Link Commits**: Reference issue numbers in commit messages (e.g., `#123`)
- **Close on Completion**: Close issues only when task is fully complete and staged

### Milestone Checks
Major milestones include:
- Completion of a full phase (e.g., Phase 1: Foundation & Authentication)
- Implementation of a core feature (e.g., Game Collection Management complete)
- Significant architectural changes
- Ready for testing or review

### Documentation Standards
- **Be Concise**: Keep documentation brief and to the point
- **Refactor for Conciseness**: Regularly review and condense verbose documentation
- **Avoid Redundancy**: Don't repeat information that exists elsewhere
- **Update as You Go**: Update docs with code changes, don't defer
- **No Unnecessary Detail**: Focus on what developers need to know, not everything

## Notes for AI Assistants

When working on this project:

1. **Respect the architecture**: Follow the MVC pattern and existing structure
2. **Check existing code**: Before creating new components, check if similar functionality exists
3. **Use type safety**: Add JSDoc comments for better IDE support
4. **Follow conventions**: Adhere to the naming and organization conventions outlined above
5. **Test integrations**: Always verify Firebase and PokéAPI integrations work correctly
6. **Consider caching**: Implement caching for API calls to improve performance
7. **Handle errors**: Add comprehensive error handling for all external operations
8. **Document changes**: Update this file if making significant architectural changes
9. **Responsive design**: Ensure all UI components work on mobile and desktop
10. **User experience**: Prioritize smooth interactions and loading states
11. **Follow Workflow**: Strictly adhere to the Workflow Guardrails section above12. **Use gh CLI**: Manage tasks and issues using GitHub CLI commands13. **Work on Branches**: Never commit directly to master; use feature/phase branches14. **Concise Documentation**: Keep all documentation concise and actionable

## Quick Reference Commands

```bash
# Start development environment
npm run dev

# Install new dependency
npm install package-name

# Install client dependency
cd client && npm install package-name

# Create production build
npm run build

# Check for errors
npm run lint  # (if configured)

# Run tests
npm test  # (if configured)
```

## Daily Workflow Pattern
```
1. Check progress:    ghp
2. Find next task:    ghn
3. Start task:        ghst <number>
4. Do the work:       <code, test, commit>
5. Complete task:     ghc <number> "Done"
6. Check milestone:   ghs phase-1-setup
7. Create PR?:        (if at major milestone)
8. Repeat
```
## Quick Commands
```
Command	Action
ghp	Show all phases overview
ghn	Show next available tasks
ghm	Show my assigned tasks
ghst 5	Start working on task #5
ghc 5	Complete task #5
ghs phase-1-setup	Show Phase 1 status
```
---

Last Updated: 2025-10-29
Version: 1.0.0

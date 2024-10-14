# Pokémon Tracker Platform - Systems Document

## Project Overview
This project is a Pokémon tracking platform where users can track their progress across multiple Pokémon games from all generations. Users can manage their game collection, organize Pokémon boxes, track Pokédex completion, and monitor overall progress across all games.

### Tech Stack
- Backend: Node.js with Express.js
- Database: Firestore & Firebase
- Frontend: React.js
- API: PokéAPI for Pokémon data
- Architecture: MVC (Model-View-Controller) methodology
- Caching: Local storage for client-side caching

## Core Functionalities

### 1. User Authentication (using Firebase Authentication)

    Files involved:

    - controllers/userController.js
    - models/User.js
    - routes/userRoutes.js
    - views/pages/Login.ejs
    - views/pages/Register.ejs
    - views/pages/UserProfile.ejs
    - services/firebaseService.js


    Approach:
        a. Implement user registration and login forms
        b. Use Firebase Authentication for user management
        c. Create user profile in Firebase upon successful registration
        d. Implement user profile management page

### 2. Game Management

    Files involved:

    - controllers/gameController.js
    - models/Game.js
    - routes/gameRoutes.js
    - views/pages/Games.ejs
    - services/firebaseService.js


    Approach:
        a. Store game data in Firebase
        b. Create an admin panel for adding new games (separate functionality)
        c. Display all games on the Games page
        d. Implement "Add to Collection" button for each game
        e. Prompt user for game instance details (condition, date purchased, price)
        f. Store user's game instances in Firebase under their user profile
        g. Update game card to show owned instances
        h. Implement buttons for managing Pokéboxes, deleting instances, and modifying details

### 3. Pokébox System

    Files involved:

    - controllers/pokemonController.js
    - models/Pokemon.js
    - routes/pokemonRoutes.js
    - views/pages/Pokebox.ejs
    - services/pokeApiService.js
    - services/firebaseService.js
    - utils/cacheUtils.js


    Approach:
        a. Fetch Pokémon data for the specific game from PokéAPI
        b. Store Pokémon silhouettes in Firebase and local cache
        c. Display Pokémon in Pokédex order for the specific game
        d. Implement box navigation (next/previous)
        e. Create dropdown for living dex options (living-dex, living form dex, etc.)
        f. Implement Pokémon detail panel with all relevant information
        g. Add buttons for marking Pokémon status (unseen, seen, caught, shiny)
        h. Implement individual catch tracking system
        i. Display Pokéball sprite for caught/shiny Pokémon
        j. Add functionality for managing caught Pokémon (level up/down, move to party, release)

### 4. Pokédex Tracking

    Files involved:

    - controllers/pokemonController.js
    - models/Pokemon.js
    - routes/pokemonRoutes.js
    - views/pages/Pokedex.ejs
    - services/pokeApiService.js
    - services/firebaseService.js


    Approach:
        a. Fetch Pokédex data for each game from PokéAPI
        b. Store user's Pokédex progress in Firebase
        c. Display Pokédex completion for each game
        d. Implement overall Pokédex completion across all games
        e. Allow marking Pokémon as caught, seen, or neither

### 5. Game Progress Tracking

    Files involved:

        -controllers/gameController.js
        -models/Game.js
        -routes/gameRoutes.js
        -views/pages/GameProgress.ejs
        -services/firebaseService.js


    Approach:
        a. Implement completion percentage tracking for individual games
        b. Calculate and display overall completion percentage across all games
        c. Add system for tracking milestones (gym badges, special events)
        d. Store progress data in Firebase under user profile

### 6. Dashboard

    Files involved:

        -controllers/userController.js
        -views/pages/Dashboard.ejs
        -services/firebaseService.js


    Approach:
        a. Create a dashboard page displaying user's game collection overview
        b. Fetch and display quick stats on Pokédex completion and game progress
        c. Implement a system for tracking and displaying recent activities and achievements

### 7. Data Synchronization

    Files involved:

        -services/firebaseService.js
        -utils/cacheUtils.js
        -app.js


    Approach:
        a. Implement real-time data syncing between client and Firestore
        b. Use local storage for caching frequently accessed data
        c. Implement offline functionality for basic features
        d. Sync local changes with Firestore when connection is restored

## Doc

### Pokémon Tracker Platform - External Documentation References

#### PokeAPI

URL: https://pokeapi.co/docs/v2

##### Accessing Pokémon Data

To get data for a specific Pokémon:

```javascript
const response = await fetch('https://pokeapi.co/api/v2/pokemon/pikachu');
const data = await response.json();
```

Important fields in the response:

```json
{
  "id": 25,
  "name": "pikachu",
  "sprites": {
    "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
    "front_shiny": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png"
  },
  "types": [
    {
      "slot": 1,
      "type": {
        "name": "electric",
        "url": "https://pokeapi.co/api/v2/type/13/"
      }
    }
  ],
  "stats": [
    {
      "base_stat": 35,
      "effort": 0,
      "stat": {
        "name": "hp",
        "url": "https://pokeapi.co/api/v2/stat/1/"
      }
    },
    // ... other stats
  ]
}
```

###### Accessing Game Data

To get data for a specific game:

```javascript
const response = await fetch('https://pokeapi.co/api/v2/version/1/');
const data = await response.json();
```

Response structure:

```json
{
  "id": 1,
  "name": "red",
  "names": [
    {
      "language": {
        "name": "ja-Hrkt",
        "url": "https://pokeapi.co/api/v2/language/1/"
      },
      "name": "赤"
    },
    // ... names in other languages
  ],
  "version_group": {
    "name": "red-blue",
    "url": "https://pokeapi.co/api/v2/version-group/1/"
  }
}
```

#### Firestore

URL: https://firebase.google.com/docs/firestore

##### Setting up Firestore

```javascript
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Your web app's Firebase configuration
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

##### Adding Data

```javascript
import { collection, addDoc } from "firebase/firestore"; 

try {
  const docRef = await addDoc(collection(db, "users"), {
    first: "Ada",
    last: "Lovelace",
    born: 1815
  });
  console.log("Document written with ID: ", docRef.id);
} catch (e) {
  console.error("Error adding document: ", e);
}
```

##### Reading Data

```javascript
import { collection, getDocs } from "firebase/firestore"; 

const querySnapshot = await getDocs(collection(db, "users"));
querySnapshot.forEach((doc) => {
  console.log(`${doc.id} => ${doc.data()}`);
});
```

##### Updating Data

```javascript
import { doc, updateDoc } from "firebase/firestore";

const userRef = doc(db, "users", "user_id");

await updateDoc(userRef, {
  "age": 13
});
```

##### Deleting Data

```javascript
import { doc, deleteDoc } from "firebase/firestore";

await deleteDoc(doc(db, "users", "user_id"));
```

## Firebase Authentication

URL: https://firebase.google.com/docs/auth

### Setting up Authentication

```javascript
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

const auth = getAuth();
```

##### User Registration

```javascript
createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    // ..
  });
```

##### User Login

```javascript
signInWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    // Signed in 
    const user = userCredential.user;
    // ...
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
  });
```

#### Express.js

URL: https://expressjs.com/en/starter/hello-world.html

##### Basic Setup

```javascript
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
```

##### Routing

```javascript
app.get('/games', (req, res) => {
  // Logic to fetch and return games
})

app.post('/games', (req, res) => {
  // Logic to add a new game
})
```

#### EJS (Embedded JavaScript templating)

URL: https://ejs.co/#docs

##### Basic Usage

```javascript
const ejs = require('ejs');
let people = ['geddy', 'neil', 'alex'];
let html = ejs.render('<%= people.join(", "); %>', {people: people});
```

##### In Express.js

```javascript
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.render('index', { title: 'Hey', message: 'Hello there!' });
});
```

EJS file (index.ejs):

```ejs
<h1><%= title %></h1>
<p><%= message %></p>
```

This compilation provides a quick reference for the main technologies you'll be using in the Pokémon tracking project. Remember to always refer to the official documentation for the most up-to-date and comprehensive information.

## Current File Structure

```./
├── config/
│   └── firebase.js
├── controllers/
│   ├── gameController.js
│   ├── pokemonController.js
│   └── userController.js
├── models/
│   ├── Game.js
│   ├── Pokemon.js
│   └── User.js
├── public/
│   ├── images/
│   └── styles/
├── routes/
│   ├── gameRoutes.js
│   ├── pokemonRoutes.js
│   └── userRoutes.js
├── services/
│   ├── firebaseService.js
│   └── pokeApiService.js
├── utils/
│   ├── cacheUtils.js
│   └── helpers.js
├── views/
│   ├── partials/
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   └── nav.ejs
│   ├── pages/
│   │   ├── Games.ejs
│   │   ├── home.ejs
│   │   └── user-profile.ejs
│   └── layouts/
│       └── main.ejs
├── .env
├── .gitignore
├── app.js
├── package.json
├── README.md
└── server.js
```
## Additional Requirements

### 1. Project Setup
   - Use create-react-app for initial project setup
   - Implement proper folder structure as outlined above
   - Set up ESLint and Prettier for code consistency

### 2. API Integration
   - Create a service layer for interacting with PokéAPI
   - Implement rate limiting and caching for PokéAPI requests
   - Use Axios for making HTTP requests

### 3. State Management
   - Use React Context API for global state management
   - Implement Redux for more complex state management if needed

### 4. Database Design
   - Design Firestore collections for Users, Games, and Pokémon
   - Implement proper data modeling and relationships

### 5. Authentication
   - Use Firebase Authentication for user management
   - Implement protected routes for authenticated users

### 6. Error Handling
   - Implement comprehensive error handling in both frontend and backend
   - Display user-friendly error messages
   - Log errors server-side for debugging

### 7. Testing
   - Write unit tests for critical functions and components
   - Implement integration tests for API endpoints
   - Use Jest and React Testing Library for frontend tests

### 8. Performance Optimization
   - Implement lazy loading for components and routes
   - Use React.memo and useMemo for performance optimization
   - Implement efficient querying and indexing in Firestore

### 9. Accessibility
   - Ensure the application is keyboard navigable
   - Use proper ARIA attributes for enhanced accessibility
   - Implement color contrast and font sizing for readability

### 10. Deployment
    - Set up continuous integration and deployment (CI/CD) pipeline
    - Use environment variables for sensitive information
    - Deploy the backend to a Node.js hosting platform (e.g., Heroku, DigitalOcean)
    - Deploy the frontend to a static hosting service (e.g., Netlify, Vercel)

## Recommended Additional Libraries

### 1. Lodash - For utility functions and data manipulation
### 2. Moment.js - For date and time handling
### 3. React Router - For client-side routing
### 4. Formik - For form management and validation
### 5. Yup - For schema validation
### 6. Styled-components - For component-level styling
### 7. React-query - For efficient server state management
### 8. React-virtualized - For rendering large lists efficiently

## Next Steps

### 1. Set up the basic project structure and install necessary dependencies
### 2. Implement user authentication using Firebase
### 3. Create the game management system (CRUD operations)
### 4. Develop the Pokémon box system
### 5. Integrate PokéAPI and implement Pokédex tracking
### 6. Create the dashboard with overview statistics
### 7. Implement data synchronization between Firestore and local storage
### 8. Develop and style the user interface
### 9. Write tests for critical functionality
### 10. Optimize performance and implement accessibility features
### 11. Set up deployment pipeline and deploy the application

Remember to regularly commit your changes and update this document as the project evolves. Good luck with your Pokémon tracking platform!
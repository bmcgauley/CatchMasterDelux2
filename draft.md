# Project Overview
You are building a pokemon tracking platform where users can track their progress playing multiple pokemon games across all generations. They can see the games they own, manage that games pokemon boxes, see their overall pokedex completion, track their game progress for individual games and see overall completion for all games in their dashboard. 

You will be using node.js, firestore & firebase, MVC (model view controller) methodology, pokeapi, and local storage for caching operations.

# Core Functionalities

//example:
1. See list of available sub reddits & add new sub reddits
    1. Users can see list of available sub reddits that already created display in cards, common ones like "ollana", "openai"
    2. Users can click on an add reddit button, which should open a modal for users to paste in reddit url and add 
    3. After users adding a new reddit, a new card should be added
2. Subreddit page
    1. Clicking on each subreddit, should goes to a reddit page
    2. With 2 tabs: "Top posts", "Themes"
3. Fetch reddit posts data in "Top posts"
    1. Under "Top posts" page, we want to display fetched reddit posts from past 24 hrs
    2. We will use snoowrap as library to fetch reddit data
    3. Each post including title, score, content, url, created_utc, num_comments
    4. Display the reddits in a table component, Sort based on num of score
4. Analyse reddit posts data in "Themes"
    1. For each post, we should send post data to OpenAI using structured output to categorise "Solution requests", Pain & anger", Advice requests", "Money talk";
        1. "solution requests": Posts where people are seeking solution for problems
        2. "Pain & anger": Posts where people are expressing pains or anger
        3. "Money talk": posts where people are talking about spending money
    2. This process needs to be ran concurrently for posts, so it will be faster
    3. In "themes" page, we should display each category as a card, with title, description & num of counts
    4. Clicking on the card will open side panel to display all posts under this category


# Doc



# Current File Structure



# Additional Requirements

//// example 
1. Project setup
    - All new components should go in /components at the root (not in the app folder) and be named like example-component.tsx unless otherwise specified
    - All new pages go in /app
    - Use the Next.js 14 app router
    - All data fetching should be done in a server component and pass the data down as props
    - Client components (useState, hooks, etc) require that  'use client' is set at the top of the file

2. Server-Side API Calls
    - All interactions with external APIs (e.g., Reddit, OpenAI) should be performed server-side
    - Create dedicated API routes in the 'pages/api' directory for each external API interaction
    - Client-side components should fetch data through these API routes, not directly from external APIs

3. Environment Variables
    -Store all sensitive information (API keys, credentials) in environment variables
    - Use a '.env.local' file for local development and ensure it's listed in '.gitignore'
    - For production, set environment variables in the deployment platforms (e.g., Vercel)
    - Access environment variables only in server-side code or API routes

4. Error Handling and Logging
    - Implement comprehensive error handling in both client-side components and server-side API routes
    - Log errors on the server-side for debugging purposes
    - Display user-friendly error messages on the client-side

5. Type Safety
    - Use typeScript interface for all data structures, especially API responses
    - Avoid using 'any' type; instead, define proper types for all variables and function parameters

6. API Client Initialization 
    - Initialize API clients (e.g., Snoowrap for Reddit, OpenAI) in server-side code only
    - Implement checks to ensure API clients are properly initialized before use

7. Data Fetching in Components
    - Use React hooks (e.g., 'useEffect') for data fetching in client-side components
    Implement loading states and error handling for all data fetching operations

8. Next.js



////
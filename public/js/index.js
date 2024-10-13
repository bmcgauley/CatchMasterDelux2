import {
    signIn,
    signOutUser,
    currentUser,
} from './auth.js';
import { fetchAllPokemon } from './fetchPokemon.js';
import {
    updateUIForSignedInUser,
    updateUIForSignedOutUser,
    updateFilter,
    updateMainDisplay,
} from './ui.js';
import {
    loadPokemonDataFromLocalStorage,
    updatePokemonStatus,
    savePokemonDataToLocalStorage,
    sendUpdatesToFirestore,
    pokemonData,
    initPokedex
} from './pokedex.js';
import { initGames } from './games.js';
import { initMyTeam } from './myteam.js';
import { initPokebox } from './pokebox.js';

async function initializeApp() {
    try {
        const localData = loadPokemonDataFromLocalStorage();
        
        if (localData && localData.length > 0) {
            pokemonData.push(...localData);
        } else {
            const fetchedData = await fetchAllPokemon();
            pokemonData.push(...fetchedData.results);
            savePokemonDataToLocalStorage(pokemonData);
        }

        if (currentUser) {
            await sendUpdatesToFirestore(localData);
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    
    document.getElementById('signInButton').addEventListener('click', signIn);
    document.getElementById('signOutButton').addEventListener('click', signOutUser);

    // Handle navigation
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('href').replace('/', '');
            navigateTo(page);
        });
    });

    // Initial render based on current URL
    renderContent(location.pathname.replace('/', ''));
});

window.updateFilter = updateFilter;
window.updatePokemonStatus = updatePokemonStatus;

window.addEventListener('online', () => {
    sendUpdatesToFirestore();
});

window.addEventListener('offline', () => {
    console.log('Went offline, updates will be stored locally');
});

function navigateTo(page) {
    if (page === '' || page === 'home') {
        window.location.href = '/';
    } else {
        history.pushState(null, null, `/${page}`);
        renderContent(page);
    }
}

function renderContent(page) {
    console.log('Rendering page:', page);
    switch(page) {
        case '':
        case 'home':
            // Do nothing for the home page, as it's server-rendered
            break;
        case 'games':
            updateMainDisplay('games');
            initGames();
            break;
        case 'pokedex':
            updateMainDisplay('pokedex');
            initPokedex();
            break;
        case 'myteam':
            updateMainDisplay('myteam');
            initMyTeam();
            break;
        case 'pokebox':
            updateMainDisplay('pokebox');
            initPokebox?.(); // Use optional chaining
            break;
        default:
            console.log('Unknown page:', page);
            // Don't redirect here, just log the unknown page
    }
}

window.addEventListener('popstate', () => {
    renderContent(location.pathname.replace('/', ''));
});

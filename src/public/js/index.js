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
} from './pokedex.js';
import { initGames } from './games.js';

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

        updateMainDisplay();

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
});

window.updateFilter = updateFilter;
window.updatePokemonStatus = updatePokemonStatus;

window.addEventListener('online', () => {
    sendUpdatesToFirestore();
});

window.addEventListener('offline', () => {
    console.log('Went offline, updates will be stored locally');
});

// Handle navigation
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = e.target.getAttribute('href').replace('/', '');
        navigateTo(page);
    });
});

function navigateTo(page) {
    history.pushState(null, null, page);
    renderContent(page);
}

function renderContent(page) {
    switch(page) {
        case '':
        case 'games':
            updateMainDisplay('games');
            initGames();
            break;
        case 'pokedex':
            updateMainDisplay('pokedex');
            break;
        case 'pokebox':
            updateMainDisplay('pokebox');
            break;
        default:
            console.log('Page not found');
    }
}

window.addEventListener('popstate', () => {
    renderContent(location.pathname.replace('/', ''));
});

// Initial render
renderContent(location.pathname.replace('/', ''));

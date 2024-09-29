import {
    signIn,
    signOutUser,
    auth,
    currentUser,
    clearLocalStorage,
} from './auth.js';
import { fetchPokemon } from './fetchPokemon.js';
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

async function initializeApp() {
    try {
        // Try to load data from local storage
        const localData = loadPokemonDataFromLocalStorage();
        
        if (localData && localData.length > 0) {
            console.log('Loaded data from local storage');
            pokemonData.push(...localData);
        } else {
            console.log('No local data, fetching from API');
            await fetchPokemon();
        }

        // Update the UI
        updateMainDisplay();

        // If user is signed in, sync with Firestore
        if (currentUser) {
            await sendUpdatesToFirestore(localData);
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);

document.getElementById('signInButton').addEventListener('click', signIn);
document.getElementById('signOutButton').addEventListener('click', signOutUser);

window.updateFilter = updateFilter;
window.updatePokemonStatus = updatePokemonStatus;

window.addEventListener('online', () => {
    console.log('Back online, sending pending updates');
    sendUpdatesToFirestore();
});

window.addEventListener('offline', () => {
    console.log('Went offline, updates will be stored locally');
});

window.showPokebox = function (game) {
    document.getElementById('main-container').style.display = 'none';
    document.getElementById('pokebox-container').style.display = 'block';
    displayPokebox(game);
};
import {
    getGameSpecificPokemon,
    createPokemonElement,
    getPokemonDetails,
    // displayErrorMessage,
} from './pokedexService.js';
import {
    updateFirestorePokemonStatus,
    UPDATE_INTERVAL,
    scheduleFirestoreUpdate,
    pendingUpdates,
} from './firestore.js';
import { currentUser, getFirestore, doc, getDoc, setDoc } from './auth.js';
import { delay, debounce, setupGlobalErrorHandler, rateLimiter } from './utils.js';

let currentGameId = '';
let currentBoxNumber = 1;
let pokemonPerBox = 20; // Default value for Gen 1 games (5x4 grid)
let gameSpecificPokemon = []; // Store the game-specific Pokemon data
let lastSyncTime = 0;
const SYNC_INTERVAL = 60 * 1000; // 1 minute
let isLoading = false;

const debouncedRenderCurrentBox = debounce(renderCurrentBox, 300);
const rateLimitedGetPokemonDetails = rateLimiter(getPokemonDetails, 100); // 100ms between requests

async function initPokebox() {
    setupGlobalErrorHandler();
    try {
        if (isLoading) return;
        isLoading = true;
        currentGameId = new URLSearchParams(window.location.search).get('game') || 'red-int';
        console.log('Initializing Pokebox for game:', currentGameId);
        await loadGameData();
        displayGameInfo();
        await loadGameSpecificPokemon();
        await debouncedRenderCurrentBox();
        updateStats();
        updateBoxDisplay();
        setupEventListeners();
        setupSyncEvents();
    } catch (error) {
        console.error('Error initializing Pokebox:', error);
    } finally {
        isLoading = false;
    }
}

async function loadGameData() {
    try {
        const response = await fetch('/games/allgengames.json');
        const allGames = await response.json();
        const currentGame = allGames.find(game => game.id === currentGameId);
        if (currentGame) {
            pokemonPerBox = currentGame.box_capacity;
        } else {
            console.error(`Game with id ${currentGameId} not found`);
            pokemonPerBox = 20; // Default to 20 if game not found
        }
    } catch (error) {
        console.error('Error loading game data:', error);
        pokemonPerBox = 20; // Default to 20 if there's an error
    }
}

async function loadGameSpecificPokemon() {
    gameSpecificPokemon = await getGameSpecificPokemon(currentGameId);
}

function displayGameInfo() {
    const gameInfoElement = document.getElementById('game-info');
    if (gameInfoElement) {
        gameInfoElement.textContent = `Game: ${currentGameId}`;
    } else {
        console.warn('Element with id "game-info" not found');
    }
}

async function renderCurrentBox() {
    if (isLoading) return;
    isLoading = true;
    const pcBoxElement = document.getElementById('pc-box');
    if (!pcBoxElement) {
        console.error('Element with id "pc-box" not found');
        isLoading = false;
        return;
    }

    pcBoxElement.innerHTML = '';
    pcBoxElement.className = 'pokebox-grid';

    try {
        const startIndex = (currentBoxNumber - 1) * pokemonPerBox;
        const endIndex = Math.min(startIndex + pokemonPerBox, gameSpecificPokemon.length);

        const pokemonPromises = [];
        for (let i = startIndex; i < endIndex; i++) {
            const pokemon = gameSpecificPokemon[i];
            pokemonPromises.push(rateLimitedGetPokemonDetails(pokemon.name));
        }

        const pokemonDetails = await Promise.all(pokemonPromises);

        pokemonDetails.forEach((details, index) => {
            if (details) {
                const pokemon = gameSpecificPokemon[startIndex + index];
                const element = createPokemonElement(details, pokemon, index);
                pcBoxElement.appendChild(element);
            }
        });

        // Fill empty slots if needed
        for (let i = pokemonDetails.length; i < pokemonPerBox; i++) {
            const emptySlot = document.createElement('div');
            emptySlot.className = 'pokemon-slot empty';
            pcBoxElement.appendChild(emptySlot);
        }
    } catch (error) {
        console.error('Error rendering box:', error);
    } finally {
        isLoading = false;
    }
}

function updateStats() {
    const caughtCount = gameSpecificPokemon.filter(p => p.status === 'caught').length;
    const totalCount = gameSpecificPokemon.length;
    const completionPercentage = ((caughtCount / totalCount) * 100).toFixed(2);

    const caughtCountElement = document.getElementById('caught-count');
    const totalCountElement = document.getElementById('total-count');
    const completionPercentageElement = document.getElementById('completion-percentage');

    if (caughtCountElement) caughtCountElement.textContent = caughtCount;
    if (totalCountElement) totalCountElement.textContent = totalCount;
    if (completionPercentageElement) completionPercentageElement.textContent = `${completionPercentage}%`;
}

function updateBoxDisplay() {
    const boxDisplayElement = document.getElementById('current-box');
    if (boxDisplayElement) {
        boxDisplayElement.textContent = `Box ${currentBoxNumber}`;
    } else {
        console.warn('Element with id "current-box" not found');
    }
}

function setupEventListeners() {
    const prevBoxButton = document.getElementById('prev-box');
    const nextBoxButton = document.getElementById('next-box');

    if (prevBoxButton) {
        prevBoxButton.addEventListener('click', () => changeBox(-1));
    } else {
        console.warn('Element with id "prev-box" not found');
    }

    if (nextBoxButton) {
        nextBoxButton.addEventListener('click', () => changeBox(1));
    } else {
        console.warn('Element with id "next-box" not found');
    }
}

async function changeBox(direction) {
    if (isLoading) return;
    const totalBoxes = Math.ceil(gameSpecificPokemon.length / pokemonPerBox);
    currentBoxNumber += direction;
    if (currentBoxNumber < 1) currentBoxNumber = totalBoxes;
    if (currentBoxNumber > totalBoxes) currentBoxNumber = 1;
    debouncedRenderCurrentBox();
    updateBoxDisplay();
}

async function handlePokemonClick(pokemonId, boxIndex) {
    console.log(`Clicked on Pokemon ${pokemonId} at box index ${boxIndex}`);
    await showPokemonDetails(pokemonId, gameSpecificPokemon);
}

async function updatePokemonBoxStatus(pokemonId, status) {
    try {
        const pokemon = gameSpecificPokemon.find(p => p.id === pokemonId);
        if (pokemon) {
            pokemon.status = status;
            pendingUpdates[pokemonId] = { id: pokemonId, status: status };
            scheduleFirestoreUpdate(pendingUpdates);
            await renderCurrentBox();
            updateStats();
        }
    } catch (error) {
        console.error('Error updating Pokemon status:', error);
    }
}

function handlePokemonStatusChange(pokemonId, newStatus) {
    try {
        const pokemon = gameSpecificPokemon.find(p => p.id === pokemonId);
        if (pokemon) {
            pokemon.status = newStatus;
            updateFirestorePokemonStatus(currentGameId, pokemonId, newStatus);
            renderCurrentBox();
            updateStats();
            showPokemonDetails(pokemonId, gameSpecificPokemon);
        }
    } catch (error) {
        console.error('Error handling Pokemon status change:', error);
    }
}

function setupSyncEvents() {
    // Sync when leaving the page
    window.addEventListener('beforeunload', () => {
        if (currentUser) {
            syncWithFirestore(currentGameId, gameSpecificPokemon);
        }
    });

    // Sync on visibility change (tab switch or minimize)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && currentUser) {
            syncWithFirestore(currentGameId, gameSpecificPokemon);
        }
    });

    // Periodic sync
    setInterval(() => {
        const now = Date.now();
        if (now - lastSyncTime >= SYNC_INTERVAL && currentUser) {
            syncWithFirestore(currentGameId, gameSpecificPokemon);
            lastSyncTime = now;
        }
    }, SYNC_INTERVAL);
}

// Make handlePokemonStatusChange available globally
window.handlePokemonStatusChange = handlePokemonStatusChange;

// Make renderCurrentBox available globally
window.renderCurrentBox = renderCurrentBox;

// Initialize the Pokébox when the DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPokebox);
} else {
    initPokebox();
}

export { initPokebox, currentGameId, handlePokemonStatusChange, gameSpecificPokemon };

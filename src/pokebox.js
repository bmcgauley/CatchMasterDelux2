import { db, doc, getDoc, setDoc, currentUser } from './auth.js';
import {
	fetchUserPokemonStatus,
	savePokemonDataToLocalStorage,
	pokemonData
} from './pokedex.js';
import { displayPokemon } from './ui.js';
import fetchPokemon from './fetchPokemon.js'
// let pokemonData = []
let gameSpecificPokemon = [];
const POKEMON_PER_BOX = 20;
const UPDATE_INTERVAL = 1 * 60 * 1000; // 1 minute in milliseconds
const CLICK_DELAY = 250; // milliseconds
const LONG_PRESS_DELAY = 500; // milliseconds
let currentGameId = '';
let currentBoxNumber = 1;
let pendingUpdates = {};
// Firestore update functions
let updateTimeout;
// console.log(pokemonData);
// Function to initialize the Pokébox
async function initPokebox() {
	currentGameId =
		new URLSearchParams(window.location.search).get('game') || 'red';
	await loadPokemonData();
	await loadGameSpecificData();
	displayGameInfo();
	renderCurrentBox();
	updateStats();
    updateBoxDisplay();
	// attachEventListeners();
}
function filterPokemonForGame(gameId) {
	// Retrieve pokemonData from local storage
	let boxData = JSON.parse(localStorage.getItem('pokemonData'));
	if (!boxData || !Array.isArray(boxData)) {
		localStorage.setItem('boxData', JSON.stringify(boxData));
		console.error('Error: pokemonData is either null or not an array.');
		return;
	}
	// Filter the Pokémon for the specific game
	gameSpecificPokemon = boxData.filter((pokemon) => {
		return pokemon.games.includes(gameId);
	});
	// console.log('Filtered gameSpecificPokemon:', gameSpecificPokemon);
}
// Function to load Pokémon data
function loadPokemonData() {
	let pokemonData = JSON.parse(localStorage.getItem('pokemonData'));
	if (!pokemonData) {
		try {
			pokemonData = fetchPokemon(); // You need to implement this function
			localStorage.setItem('pokemonData', JSON.stringify(pokemonData));
		} catch (error) {
			console.error('Error fetching Pokémon data:', error);
			pokemonData = [];
		}
	}
	return pokemonData;
}
function loadGameSpecificData() {
	let gameData = JSON.parse(localStorage.getItem('gameData')) || {};
	if (!gameData[currentGameId]) {
		gameData[currentGameId] = {
			pokemon: [],
		};
		// Initialize with universal data, setting all as unseen
		const universalData = loadPokemonData();
		gameData[currentGameId].pokemon = universalData
			.filter((pokemon) => pokemon.games.includes(currentGameId))
			.map((pokemon) => ({
				id: pokemon.id,
				status: 'unseen',
				seen: false,
			}));
		localStorage.setItem('gameData', JSON.stringify(gameData));
	}
	return gameData[currentGameId];
}
function saveGameSpecificData(gameData) {
	let allGameData = JSON.parse(localStorage.getItem('gameData')) || {};
	allGameData[currentGameId] = gameData;
	localStorage.setItem('gameData', JSON.stringify(allGameData));
}
function loadPokeboxDataFromLocalStorage() {
	try {
		const storedData = localStorage.getItem(`boxData_${currentGameId}`);
		if (storedData) {
			return JSON.parse(storedData);
		}
	} catch (error) {
		console.error('Error loading from local storage:', error);
	}
	return null; // Return null if no data is found
}
// Function to load user's Pokémon status from Firestore
async function loadUserPokemonStatus() {
	if (!currentUser) return;
	// Load from local storage or fallback to pokemonData
	gameSpecificPokemon = loadPokeboxDataFromLocalStorage() || boxData.slice(); // clone pokemonData
	const userDocRef = doc(db, 'users', currentUser.uid, 'games', currentGameId);
	try {
		const docSnap = await getDoc(userDocRef);
		if (docSnap.exists()) {
			const userData = docSnap.data();
			// Update gameSpecificPokemon with user-specific data
			gameSpecificPokemon = gameSpecificPokemon.map((pokemon) => ({
				...pokemon,
				status: userData[pokemon.id]?.status || 'unseen',
				seen: userData[pokemon.id]?.seen || false,
			}));
		}
	} catch (error) {
		console.error('Error fetching user data:', error);
	}
	// Ensure gameSpecificPokemon is an array even if no data is found
	if (!Array.isArray(gameSpecificPokemon)) {
		gameSpecificPokemon = []; // Initialize as empty array if not already an array
	}
}
// Function to display game info
function displayGameInfo() {
	const gameInfoElement = document.getElementById('game-info');
	gameInfoElement.textContent = `Game: ${currentGameId}`;
}
// Function to render the current PC box
async function renderCurrentBox() {
	const pcBoxElement = document.getElementById('pokemon-container');
	pcBoxElement.innerHTML = '';
	pcBoxElement.setAttribute('class', 'pokebox-grid');
	const gameData = await loadGameSpecificData();
	const universalData = await loadPokemonData();
	const startIndex = (currentBoxNumber - 1) * POKEMON_PER_BOX;
	const endIndex = startIndex + POKEMON_PER_BOX;
	for (let i = startIndex; i < endIndex; i++) {
		const pokemonGameData = gameData.pokemon[i];
		if (pokemonGameData) {
			const universalPokemonData = universalData.find(
				(p) => p.id === pokemonGameData.id
			);
			const pokemonElement = createPokemonElement(
				pokemonGameData,
				universalPokemonData
			);
			pcBoxElement.appendChild(pokemonElement);
		} else {
			// pcBoxElement.appendChild(document.createElement('div'));
		}
	}
	document.querySelectorAll('.pokemon-card').forEach((card) => {
		const pokemonId = card.getAttribute('data-id');
		const clickHandler = handlePokemonBoxClick(pokemonId);

		// For mouse events
		card.addEventListener('mousedown', clickHandler.start);
		card.addEventListener('mouseup', clickHandler.end);
		card.addEventListener('mouseleave', clickHandler.cancel);

		// For touch events
		card.addEventListener('touchstart', (e) => {
			clickHandler.start(e);
			e.preventDefault();
		});
		card.addEventListener('touchend', (e) => {
			clickHandler.end(e);
			e.preventDefault();
		});
		card.addEventListener('touchcancel', clickHandler.cancel);
	});
    updateBoxDisplay();
}
document
	.getElementById('prev-box')
	.addEventListener('click', () => changeBox(-1));
document
	.getElementById('next-box')
	.addEventListener('click', () => changeBox(1));
// document.getElementById('current-box').textContent = `Box ${currentBoxNumber}`;
// Function to update the box display
function updateBoxDisplay() {
    document.getElementById('current-box').textContent = `Box ${currentBoxNumber}`;
}
function createPokemonElement(gameData, universalData) {
	const pokemonElement = document.createElement('li');
	pokemonElement.classList.add('pokemon-card');
	pokemonElement.dataset.id = gameData.id;
	// console.log(gameData)
	let imageSrc;
	if (gameData.status === 'shiny') {
		imageSrc = universalData.imageShiny;
		// pokemonElement.classList.add('shiny');
	} else if (!gameData.seen) {
		imageSrc = universalData.silhouetteImage;
	} else {
		imageSrc = universalData.image;
	}
	pokemonElement.innerHTML = `
        <img src="${imageSrc}" alt="${universalData.name}">
        <p>${universalData.name}</p>
        ${
					gameData.status === 'caught'
						? '<div class="pokeball-icon"></div>'
						: ''
				}
        ${
					gameData.status === 'shiny' ? '<div class="pokeball-icon"></div>' : ''
				}
    `;
	// pokemonElement.classList.add(gameData.status);
	return pokemonElement;
}
// Function to update stats
async function updateStats() {
	const gameData = await loadGameSpecificData();
	const caughtCount = gameData.pokemon.filter(
		(p) => p.status === 'caught' || p.status === 'shiny'
	).length;
	const totalCount = gameData.pokemon.length;
	const completionPercentage = ((caughtCount / totalCount) * 100).toFixed(2);
	document.getElementById('caught-count').textContent = caughtCount;
	document.getElementById('total-count').textContent = totalCount;
	document.getElementById(
		'completion-percentage'
	).textContent = `${completionPercentage}%`;
}
// Function to attach event listeners
// function attachEventListeners() {

//     // const pcBox = document.getElementById('pc-box');
//     // pcBox.addEventListener('mousedown', handlePokemonInteractionStart);
//     // pcBox.addEventListener('mouseup', handlePokemonInteractionEnd);
//     // pcBox.addEventListener('touchstart', handlePokemonInteractionStart);
//     // pcBox.addEventListener('touchend', handlePokemonInteractionEnd);
//     document.getElementById('prev-box').addEventListener('click', () => changeBox(-1));
//     document.getElementById('next-box').addEventListener('click', () => changeBox(1));
// }

// Pokémon interaction handlers
// let activeInteraction = null;
// function handlePokemonInteractionStart(event) {
//     const pokemonSlot = event.target.closest('.pokemon-slot');
//     if (!pokemonSlot) return;
//     const pokemonId = pokemonSlot.dataset.id;
//     activeInteraction = handlePokemonBoxClick(pokemonId);
//     activeInteraction.start(event);
// }
// function handlePokemonInteractionEnd(event) {
//     if (activeInteraction) {
//         activeInteraction.end(event);
//         activeInteraction = null;
//     }
// }
// Existing handlePokemonClick function
export function handlePokemonBoxClick(pokemonId) {
	let clickTimer = null;
	let longPressTimer = null;
	let clickCount = 0;
	let isLongPress = false;
	const gameData = loadGameSpecificData();
	// console.log(clickCount)
	return {
		start: (event) => {
			event.preventDefault();
			clickCount++;
			isLongPress = false;
			if (clickCount === 1) {
				longPressTimer = setTimeout(() => {
					if (clickCount === 1) {
						isLongPress = true;
						updatePokemonBoxStatus(pokemonId, 'shiny');
						clickCount = 0;
					}
				}, LONG_PRESS_DELAY);
			}
		},
		end: (event) => {
			event.preventDefault();
			clearTimeout(longPressTimer);

			if (!isLongPress) {
				if (clickCount === 1) {
					clickTimer = setTimeout(() => {
						if (clickCount === 1) {
							// Single click
							const pokemon = gameData.pokemon.find(
								(p) => p.id === parseInt(pokemonId)
							);
							const newStatus = pokemon.status === 'unseen' ? 'seen' : 'unseen';
							updatePokemonBoxStatus(pokemonId, newStatus);
							// console.log('Single click activated');
						}
						// console.log(clickCount)
						clickCount = 0;
					}, CLICK_DELAY);
				} else if (clickCount === 2) {
					// console.log(clickCount)
					clearTimeout(clickTimer);
					// Double click
					updatePokemonBoxStatus(pokemonId, 'caught');
					// console.log('Double click activated');
					clickCount = 0;
				}
			}
		},
		cancel: () => {
			clearTimeout(clickTimer);
			clearTimeout(longPressTimer);
			clickCount = 0;
			isLongPress = false;
		},
	};
}
// Function to update Pokémon status
function updatePokemonBoxStatus(pokemonId, status) {
	const gameData = loadGameSpecificData();
	// console.log(pendingUpdates)
	const pokemon = gameData.pokemon.find((p) => p.id === parseInt(pokemonId));
	if (pokemon) {
		pokemon.status = status;
		pokemon.seen = status !== 'unseen';
		pendingUpdates[pokemonId] = {
			status: pokemon.status,
			seen: pokemon.seen,
		};
		// console.log(`Updated Pokemon ${pokemonId} status: ${status}`);
		// console.log("Current pending updates:", pendingUpdates);
		saveGameSpecificData(gameData);
		scheduleFirestoreUpdate();
		renderCurrentBox();
		updateStats();
	}
}
// Function to change the current box
function changeBox(direction) {
	const gameData = loadGameSpecificData();
	const totalBoxes = Math.ceil(gameData.pokemon.length / POKEMON_PER_BOX);
	currentBoxNumber += direction;
	if (currentBoxNumber < 1) currentBoxNumber = totalBoxes;
	if (currentBoxNumber > totalBoxes) currentBoxNumber = 1;
	renderCurrentBox();
    updateBoxDisplay();
}
// let updateTimeout;
function scheduleFirestoreUpdate() {
	clearTimeout(updateTimeout);
	updateTimeout = setTimeout(sendUpdatesToFirestore, UPDATE_INTERVAL);
	console.log(
		`Firestore update scheduled in ${UPDATE_INTERVAL / 1000 / 60} minutes.`
	);
}
async function sendUpdatesToFirestore() {
	if (!currentUser || Object.keys(pendingUpdates).length === 0) {
		// console.log("No updates to send or user not logged in");
		return;
	}
	const gameDocRef = doc(db, 'users', currentUser.uid, 'games', currentGameId);
	try {
		// console.log("Pending updates:", pendingUpdates);
		// Fetch the current document
		const docSnap = await getDoc(gameDocRef);
		let currentData = docSnap.exists() ? docSnap.data() : { pokemon: {} };
		// Merge pending updates with current data
		for (const [pokemonId, updates] of Object.entries(pendingUpdates)) {
			if (!currentData.pokemon[pokemonId]) {
				currentData.pokemon[pokemonId] = {};
			}
			Object.assign(currentData.pokemon[pokemonId], updates);
		}
		// console.log("Sending updates to Firestore:", currentData);
		await setDoc(gameDocRef, currentData, { merge: true });
		console.log('Updates sent successfully');
		// Verify the update
		const updatedDocSnap = await getDoc(gameDocRef);
		// console.log("Updated Firestore document:", updatedDocSnap.data());
		// Clear pending updates after successful send
		pendingUpdates = {};
	} catch (error) {
		console.error('Error updating Firestore:', error);
	}
}
// Helper function to trigger immediate update (for testing)
function triggerImmediateUpdate() {
	clearTimeout(updateTimeout);
	sendUpdatesToFirestore();
}
// Local storage functions
function savePokeboxDataToLocalStorage() {
	savePokemonDataToLocalStorage();
}
// export { boxData }
document.querySelectorAll('.pokemon-icon').forEach((pokemon) => {
	pokemon.setAttribute('draggable', true);
	pokemon.addEventListener('dragstart', (event) => {
		event.dataTransfer.setData('text', event.target.id); // Pass Pokémon id
	});
});
document.querySelectorAll('.pokemon-slot').forEach((slot) => {
	slot.addEventListener('click', async (e) => {
		const pokemonId = e.target.dataset.id;
		// Get the current Pokémon data from local storage
		let pokemonData = JSON.parse(localStorage.getItem('pokemonData'));
		if (pokemonData) {
			// Example logic to mark the Pokémon as seen
			const pokemon = pokemonData.find((p) => p.id === parseInt(pokemonId));
			if (pokemon) {
				pokemon.seen = true;
				// Update local storage
				updatePokemonInLocalStorage(pokemon.id, { seen: true });
				// Optional: Sync to Firestore
				await updateFirestorePokemonStatus(pokemon.id, { seen: true });
			}
		}
	});
});
async function updateFirestorePokemonStatus(pokemonId, updatedData) {
	const userDocRef = doc(db, 'users', currentUser.uid, 'games', currentGameId);
	// Get the document snapshot first
	const docSnap = await getDoc(userDocRef);
	if (docSnap.exists()) {
		const userData = docSnap.data();
		// Only update the relevant Pokémon data
		userData[pokemonId] = { ...userData[pokemonId], ...updatedData };
		// Write back to Firestore
		await setDoc(userDocRef, userData);
	}
}
// Initialize the Pokébox when the DOM is loaded
document.addEventListener('DOMContentLoaded', initPokebox);

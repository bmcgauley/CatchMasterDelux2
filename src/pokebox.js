// import { db, doc, getDoc, setDoc, currentUser } from './auth.js';
import {
	getGameSpecificPokemon,
	createPokemonElement,
	getPokemonDetails,
	displayErrorMessage,
} from './pokedexService.js';
import {
	updateFirestorePokemonStatus,
	UPDATE_INTERVAL,
	scheduleFirestoreUpdate,
	pendingUpdates,
} from './firestore.js';

// let pokemonData = []
let ifBox = true;
let currentGameId = '';
const POKEMON_PER_BOX = 20;
const CLICK_DELAY = 250; // milliseconds
const LONG_PRESS_DELAY = 500; // milliseconds
let currentBoxNumber = 1;

async function initPokebox() {
	currentGameId =
		new URLSearchParams(window.location.search).get('game') || 'red';
	// await loadPokemonData();
	await loadGameSpecificData();
	displayGameInfo();
	renderCurrentBox();
	updateStats();
	updateBoxDisplay();
	// displayPokemon()
	// attachEventListeners();
}

// Function to load Pokémon data
function loadPokemonData() {
	let pokemonData = JSON.parse(localStorage.getItem('pokemonData'));
	if (!pokemonData) {
		try {
			pokemonData = fetchPokemonDataFromAPI();
			localStorage.setItem('pokemonData', JSON.stringify(pokemonData));
		} catch (error) {
			console.error('Error fetching Pokémon data:', error);
			pokemonData = [];
		}
	}
	return pokemonData;
}

//
function loadGameSpecificData(gameId, instanceId) {
	let gameData = JSON.parse(localStorage.getItem('gameData')) || {};
	if (!gameData[currentGameId]) {
		gameData[currentGameId] = {
			pokemon: [],
		};
		// Initialize with universal data, setting all as unseen
		const universalData = loadPokemonData();
		console.log(universalData);
		gameData[currentGameId].pokemon = universalData
			.filter((pokemon) => pokemon.games.includes(currentGameId))
			.map((pokemon) => ({
				id: pokemon.id,
				status: 'unseen',
				seen: false,
			}));
		localStorage.setItem('gameData', JSON.stringify(gameData));
	}
	// console.log('Loading Game Specific Data: ', gameData[currentGameId])
	return gameData[currentGameId];
}

//
function saveGameSpecificData(gameData) {
	let allGameData = JSON.parse(localStorage.getItem('gameData')) || {};
	// const mergedArray = gameData.map((item, index) => ({ ...item, ...gameDataForPokemon[index] }));
	allGameData[currentGameId] = gameData;
	localStorage.setItem('gameData', JSON.stringify(allGameData));
}

//
// function loadPokeboxDataFromLocalStorage() {
// 	try {
// 		const storedData = localStorage.getItem(`boxData_${currentGameId}`);
// 		if (storedData) {
// 			return JSON.parse(storedData);
// 		}
// 	} catch (error) {
// 		console.error('Error loading from local storage:', error);
// 	}
// 	return null;
// }

// Function to load user's Pokémon status from Firestore
// async function loadUserPokemonStatus() {
// 	if (!currentUser) return;
// 	// Load from local storage or fallback to pokemonData
// 	gameSpecificPokemon = loadPokeboxDataFromLocalStorage() || boxData.slice(); // clone pokemonData
// 	const userDocRef = doc(db, 'users', currentUser.uid, 'games', currentGameId);
// 	try {
// 		const docSnap = await getDoc(userDocRef);
// 		if (docSnap.exists()) {
// 			const userData = docSnap.data();
// 			// Update gameSpecificPokemon with user-specific data
// 			gameSpecificPokemon = gameSpecificPokemon.map((pokemon) => ({
// 				...pokemon,
// 				status: userData[pokemon.id]?.status || 'unseen',
// 				seen: userData[pokemon.id]?.seen || false,
// 			}));
// 		}
// 	} catch (error) {
// 		console.error('Error fetching user data:', error);
// 	}
// 	// Ensure gameSpecificPokemon is an array even if no data is found
// 	if (!Array.isArray(gameSpecificPokemon)) {
// 		gameSpecificPokemon = [];
// 	}
// }

// Function to display game info
function displayGameInfo() {
	const gameInfoElement = document.getElementById('game-info');
	gameInfoElement.textContent = `Game: ${currentGameId}`;
}

//
async function renderCurrentBox() {
	const pcBoxElement = document.getElementById('pc-box');
	pcBoxElement.innerHTML = '';
	pcBoxElement.setAttribute('class', 'pokebox-grid');

	try {
		// Fetch game-specific Pokémon data
		const gameData = await getGameSpecificPokemon(currentGameId);
		const localGameData = loadGameSpecificData(currentGameId);
		const gameDataForPokemon = loadGameSpecificData(currentGameId);

		const mergedArray = gameData.map((item, index) => ({
			...item,
			...gameDataForPokemon.pokemon,
		}));

		// Calculate the range of Pokémon to display in the current box
		const startIndex = (currentBoxNumber - 1) * POKEMON_PER_BOX;
		const endIndex = Math.min(startIndex + POKEMON_PER_BOX, mergedArray.length);

		// Slice the gameData array to get only the Pokémon for the current box
		const currentBoxPokemon = mergedArray.slice(startIndex, endIndex);

		// Fetch detailed data for all Pokémon in the current box
		const detailedPokemonPromises = currentBoxPokemon.map((pokemon) =>
			getPokemonDetails(pokemon.name)
		);
		const detailedPokemonData = await Promise.all(detailedPokemonPromises);

		// Render each Pokémon in the box
		detailedPokemonData.forEach((pokemonData, index) => {
			if (pokemonData && mergedArray[pokemonData.id]) {
				const pokemonElement = createPokemonElement(
					pokemonData,
					mergedArray[pokemonData.id - 1],
					index
				);
				pcBoxElement.appendChild(pokemonElement);
			}
		});

		// Fill empty slots if there are fewer than POKEMON_PER_BOX
		for (let i = detailedPokemonData.length; i < POKEMON_PER_BOX; i++) {
			pcBoxElement.appendChild(document.createElement('li'));
		}

		// Add event listeners to Pokémon cards
		document.querySelectorAll('.pokemon-card').forEach((card, index) => {
			const pokemonId = card.getAttribute('data-id');
			const clickHandler = handlePokemonBoxClick(pokemonId - 1, index);

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
	} catch (error) {
		console.error('Error rendering current box:', error);
		displayErrorMessage(`Failed to render Pokémon box: ${error.message}`);
	}
}

// Function to update the box display
function updateBoxDisplay() {
	document.getElementById(
		'current-box'
	).textContent = `Box ${currentBoxNumber}`;
}

// Function to update stats
async function updateStats() {
	const gameData = await loadGameSpecificData();
	// console.log(gameData.pokemon)
	const caughtCount = gameData.pokemon.filter(
		(p) => p.status === 'caught' || p.status === 'shiny'
	).length;
	const totalCount = gameData.length;
	const completionPercentage = ((caughtCount / totalCount) * 100).toFixed(2);
	document.getElementById('caught-count').textContent = caughtCount;
	document.getElementById('total-count').textContent = totalCount;
	document.getElementById(
		'completion-percentage'
	).textContent = `${completionPercentage}%`;
}

// Existing handlePokemonClick function
export function handlePokemonBoxClick(pokemonId, boxIndex) {
	let clickTimer = null;
	let longPressTimer = null;
	let clickCount = 0;
	let isLongPress = false;
	const gameData = loadGameSpecificData();
	const p = gameData.pokemon[pokemonId].id;
	const box = boxIndex;
	const poke = gameData.pokemon[pokemonId];

	return {
		start: (event) => {
			event.preventDefault();
			clickCount++;
			isLongPress = false;
			if (clickCount === 1) {
				longPressTimer = setTimeout(() => {
					if (clickCount === 1) {
						isLongPress = true;
						updatePokemonBoxStatus(p, 'shiny');

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
							const newStatus = poke.status === 'unseen' ? 'seen' : 'unseen';
							updatePokemonBoxStatus(p, newStatus);
						}
						clickCount = 0;
					}, CLICK_DELAY);
				} else if (clickCount === 2) {
					clearTimeout(clickTimer);
					// Double click
					updatePokemonBoxStatus(p, 'caught');
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
async function updatePokemonBoxStatus(pokemonId, status) {
	const gameData = loadGameSpecificData(currentGameId);
	const pokemonData = JSON.parse(localStorage.getItem('pokemonData'));
	let card = document.querySelector('pokemon-card');
	const pokemon = gameData.pokemon[pokemonId - 1];
	const Mon = pokemonData[pokemonId - 1];

	if (pokemon) {
		pokemon.status = status;
		pokemon.seen = status !== 'unseen';
		pendingUpdates[pokemonId] = {
			id: pokemonId,
			name: Mon.name,
			status: pokemon.status,
			seen: pokemon.seen,
		};

		handlePokemonBoxClick(pokemonId);
		saveGameSpecificData(gameData);
		scheduleFirestoreUpdate(pendingUpdates);
		renderCurrentBox();
		updateBoxDisplay();
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

//
document.querySelectorAll('.pokemon-icon').forEach((pokemon) => {
	pokemon.setAttribute('draggable', true);
	pokemon.addEventListener('dragstart', (event) => {
		event.dataTransfer.setData('text', event.target.id); // Pass Pokémon id
	});
});

//
document.querySelectorAll('.pokemon-card').forEach((slot) => {
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

// Initialize the Pokébox when the DOM is loaded
if (window.location.href.includes('pokebox.html')) {
	ifBox = true;
	document.addEventListener('DOMContentLoaded', initPokebox);
	document
		.getElementById('prev-box')
		.addEventListener('click', () => changeBox(-1));

	//
	document
		.getElementById('next-box')
		.addEventListener('click', () => changeBox(1));
	console.log("The URL contains 'pokebox.html'");
} else {
	ifBox = false;
	console.log("The URL does not contain 'pokebox.html'");
}
if (ifBox) {
}
//

export { currentGameId };

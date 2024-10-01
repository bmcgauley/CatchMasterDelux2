import { db, getFirestore, doc, getDoc, setDoc, currentUser } from './auth.js';
import { displayPokemon } from './ui.js';
import { loadPokemonDataFromLocalStorage, pokemonData } from './pokedex.js';
const gameLocations = ['./games/gen1games.json', './games/gen2games.json'];
// console.log(gameLocations);
let pokemonGames = [];

// Function to navigate to the Pokébox page
export function navigateToPokeBox(gameId) {
	window.location.href = `./pokebox.html?game=${gameId}`;
}

function fetchPokemonGames() {
    
	let gen = [];
	return fetch(gameLocations[0])
		.then((response) => response.json())
		.then((data) => {
			pokemonGames.push(data[0]);
			pokemonGames.push(data[1]);
			pokemonGames.push(data[2]);
            loadGames(pokemonGames)
		})
		.then(
			fetch(gameLocations[1])
				.then((response) => response.json())
				.then((data) => {
					pokemonGames.push(data[0]);
					pokemonGames.push(data[1]);
					pokemonGames.push(data[2]);
                    loadGames(pokemonGames)
				})
		)
		

		.catch((error) => {
			console.error('Error loading the game data:', error);
		});
}
// Function to perform the Firestore save
function saveToFirestore(gameId, regions, paidPrice, retailPrice) {
	const userId = currentUser.uid; // Get the current user ID
	const gameData = {
		regionsOwned: regions,
		paidPrice: parseFloat(paidPrice),
		retailPrice: retailPrice
	};
	const gameDocRef = doc(db, `users/${userId}/games/${gameId}`);

	setDoc(gameDocRef, gameData, { merge: true })
		.then(() => {
			console.log(`Saved data for ${gameId} successfully!`);
		})
		.catch((error) => {
			console.error('Error saving data:', error);
		});
}

// Call this function after rendering the game tiles
export function saveGameToFirestore(gameId) {
	const regionSelect = document.getElementById(`languagesAvailable-${gameId}`);
	const paidPriceInput = document.getElementById(`pricePaid-${gameId}`);
	const statusSelect = document.getElementById(`game-${gameId}-status`);
	const quantityInput = document.getElementById(`game-${gameId}-quantity`);

	console.log(
		`Saving game ${gameId}:`,
		regionSelect.value,
		paidPriceInput.value
	);

	const selectedRegions = Array.from(regionSelect.selectedOptions).map(
		(option) => option.value
	);

	const paidPrice = paidPriceInput.value;
	const status = statusSelect.value;
	const quantity = quantityInput.value;

	const retailPriceElement = document.getElementById(`retail-price-${gameId}`);
	const retailPrice = retailPriceElement
		? retailPriceElement.textContent
		: null;

	saveToFirestore(
		gameId,
		selectedRegions,
		paidPrice,
		retailPrice,
		status,
		quantity
	);
}

// Updated loadGames function
export function loadGames() {
	const gamesContainer = document.getElementById('games');
	// Check if the element exists
	if (!gamesContainer) {
		console.error('Could not find the #games container element.');
		return;
	}

	gamesContainer.innerHTML = '<h3>Sort by Game</h3>';

	pokemonGames.forEach((game) => {
		console.log(pokemonGames)
		const gameHTML = `
            <div class="game-tile" data-game-id="${game.id}">
                <img class="boxart" id="boxart" src="${game.boxArt}" alt="${game.title} cover">
                <h3>${game.title}</h3>
                <p>Region: ${game.region}</p>
                <p>Released: ${game.releaseYear}</p>
                <p>Original Price: $${game.gamePrice.originalPrice}</p>
                <form id="game-form-${game.id}">
                    <select id="game-${game.id}-status">
                        <option value="out-of-box">Out of Box</option>
                        <option value="in-box">In Box</option>
                        <option value="sealed">In-box Sealed (New)</option>
                    </select>
                    <select id="languagesAvailable-${game.id}">
                        <option value="English">English</option>
                        <option value="Japanese">Japanese</option>
                    </select>
                    <p>
                        Price You Paid:
                        <input type="number" id="pricePaid-${game.id}" min="0" value="${game.gamePrice.pricePaid}">
                    </p>
                    <p>
                        Number of Copies You Own:
                        <input type="number" id="game-${game.id}-quantity" min="0" value="${game.gameCopies}">
                    </p>
                    <p>
                        Save This Data:
                        <button type="button" class="save-button" data-game-id="${game.id}">Save</button>
                    </p>
                </form>
                <p>
                    Track This Game's Pokemon:
                    <button class="manage-pokebox" data-game-id="${game.id}">Manage Pokébox</button>
                </p>
            </div>
        `;
		gamesContainer.innerHTML += gameHTML;
	});

	// Attach event listeners after loading games
	attachSaveButtonListeners();
	attachManagePokeboxListeners();
}

// Updated attachSaveButtonListeners function
function attachSaveButtonListeners() {
	document.querySelectorAll('.save-button').forEach(button => {
		button.addEventListener('click', function() {
			const gameId = this.getAttribute('data-game-id');
			// console.log(gameId)
			console.log(`Save button clicked for game ${gameId}`);
			saveGameToFirestore(gameId);
		});
	});
}

function attachManagePokeboxListeners() {
	document.querySelectorAll('.manage-pokebox').forEach(button => {
		button.addEventListener('click', function() {
			const gameId = this.getAttribute('data-game-id');
			navigateToPokeBox(gameId);
		});
	});
}

// Event listener for page load
document.addEventListener('DOMContentLoaded', loadGames);
document.addEventListener('DOMContentLoaded', fetchPokemonGames);

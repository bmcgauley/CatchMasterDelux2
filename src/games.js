import { db, getFirestore, doc, getDoc, setDoc, currentUser } from './auth.js';
import { displayPokemon } from './ui.js';
import { loadPokemonDataFromLocalStorage, pokemonData } from './pokedex.js';
import { getGameInstances, loadAllGameData, addGameInstance } from './gameData.js';
const gameLocations = [
	{
		Gen1: './games/gen1games.json',
		Gen2: './games/gen2games.json',
		all: './games/allgengames.json',
	},
];
let pokemonGames = [];
let ifGames = true;

// Function to navigate to the Pokébox page
export function navigateToPokeBox(gameId) {
	window.location.href = `./pokebox.html?game=${gameId}`;
}

function fetchPokemonGames() {
	const fetchPromises = Object.values(gameLocations).map((url) =>
		fetch(url.all).then((response) => {
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			const contentType = response.headers.get('content-type');
			if (contentType && contentType.includes('application/json')) {
				return response.json();
			} else {
				// Handle non-JSON responses (e.g., log an error, return an empty array)
				console.warn(`Response from ${url} is not JSON.`);
				return []; // Or handle it differently based on your needs
			}
		})
	);

	return Promise.all(fetchPromises)
		.then((allData) => {
			pokemonGames = allData.flat();
			console.log('All Pokemon games:', pokemonGames[0]);
			loadGames(pokemonGames[0]);
		})
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
		retailPrice: retailPrice,
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
function initializeUserData() {
    let userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
        userData = { games: {} };
        localStorage.setItem('userData', JSON.stringify(userData));
    }
    return userData;
}
// Updated loadGames function
async function loadGames() {
    const gamesContainer = document.getElementById('games');
    if (!gamesContainer) {
        console.error('Could not find the #games container element.');
        return;
    }

    gamesContainer.innerHTML = '<h3>Your Game Collection</h3>';

    const allGameData = await loadAllGameData();
    const userData = initializeUserData();
    
    allGameData.games.forEach(game => {
        const gameInstances = userData.games[game.id] || [];
        const gameHTML = `
            <div class="game-section-${game.id}" id="${game.id}">
                <h4>${game.title}</h4>
                <button class="add-instance-btn" id="${game.id}">Add Copy</button>
                <div class="game-instances">
                    ${gameInstances.map(instance => createInstanceHTML(instance)).join('')}
                </div>
            </div>
        `;
        gamesContainer.innerHTML += gameHTML;
    });

    attachEventListeners();
}
async function getBoxArtForGame(instance, gameLocations) {
	const boxArt = instance.gameId;
	console.log(gameLocations);
	// const test =
	console.log(test);
}

function createInstanceHTML(instance) {
    return `
        <div class="game-instance" data-instance-id="${instance.instanceId}">
            <img class="boxart" src="${instance.boxArtUrl || ''}" alt="${instance.title || 'Game'} cover">
            <h5>${instance.title || 'Unknown Game'}</h5>
            <p>Condition: ${instance.condition || 'Unknown'}</p>
            <p>Purchased: ${instance.purchaseDate || 'Unknown'}</p>
            <p>Price: ${instance.purchasePrice !== undefined ? '$' + instance.purchasePrice.toFixed(2) : 'Not specified'}</p>
            <p>Notes: ${instance.notes || 'No notes'}</p>
            <p>Generation: ${instance.generation || 'Unknown'}</p>
            <p>Region: ${instance.region || 'Unknown'}</p>
            <p>Platform: ${instance.platforms ? instance.platforms.join(', ') : 'Unknown'}</p>
            <div class="progress-bar" style="width: 0%"></div>
            <button class="manage-pokebox" data-instance-id="${instance.instanceId}">Manage Pokébox</button>
        </div>
    `;
}
function attachEventListeners() {
    document.querySelectorAll('.add-instance-btn').forEach(button => {
        button.addEventListener('click', handleAddInstance);
    });

    document.querySelectorAll('.manage-pokebox').forEach(button => {
        button.addEventListener('click', handleManagePokebox);
    });
}

function handleAddInstance(event) {
    const gameId = event.target.getAttribute('id');
    createAddInstanceModal();
    showAddInstanceModal(gameId);
}

function handleManagePokebox(event) {
    const instanceId = event.target.getAttribute('data-instance-id');
    navigateToPokeBox(instanceId);
}

//   function showAddInstanceModal(gameId) {
// 	// Implement modal logic here
// 	// After getting user input:
// 	const newInstance = addGameInstance(gameId, condition, purchaseDate, notes);
// 	const gameSection = document.querySelector(`.game-section[data-game-id="${gameId}"]`);
// 	const instancesContainer = gameSection.querySelector('.game-instances');
// 	instancesContainer.innerHTML += createInstanceHTML(newInstance);
//   }
function showAddInstanceModal(gameId) {
    const modal = document.getElementById('add-instance-modal');
    const form = document.getElementById('add-instance-form');

    if (!modal || !form) {
        console.error('Modal or form not found');
        return;
    }

    modal.style.display = 'block';

    form.onsubmit = async function(event) {
        event.preventDefault();

        const condition = document.getElementById('condition').value;
        const purchaseDate = document.getElementById('purchaseDate').value;
        const purchasePrice = parseFloat(document.getElementById('purchasePrice').value);
        const notes = document.getElementById('notes').value;

        try {
            const newInstance = await addGameInstance(gameId, condition, purchaseDate, notes, purchasePrice);
            const gameSection = document.querySelector(`.game-section-${gameId}`);
            if (gameSection) {
                const instancesContainer = gameSection.querySelector('.game-instances');
                if (instancesContainer) {
                    instancesContainer.innerHTML += createInstanceHTML(newInstance);
                } else {
                    console.error('Instances container not found');
                }
            } else {
                console.error('Game section not found');
            }

            modal.style.display = 'none';
            form.reset();
        } catch (error) {
            console.error('Error adding game instance:', error);
        }
    };
}

// Add this function to close the modal if needed
function closeAddInstanceModal() {
	const modal = document.getElementById('add-instance-modal');
	modal.style.display = 'none';
}
// Updated attachSaveButtonListeners function
function attachSaveButtonListeners() {
	document.querySelectorAll('.save-button').forEach((button) => {
		button.addEventListener('click', function () {
			const gameId = this.getAttribute('id');
			// console.log(gameId)
			console.log(`Save button clicked for game ${gameId}`);
			saveGameToFirestore(gameId);
		});
	});
}

function attachManagePokeboxListeners() {
	document.querySelectorAll('.manage-pokebox').forEach((button) => {
		button.addEventListener('click', function () {
			const gameId = this.getAttribute('data-game-id');
			navigateToPokeBox(gameId);
		});
	});
}

if (window.location.href.includes('games.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        initializeUserData();
        loadGames();
    });
    console.log("The URL contains 'games.html'");
} else {
    console.log("The URL does not contain 'games.html'");
}




function createAddInstanceModal() {
    let modal = document.getElementById('add-instance-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'add-instance-modal';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Add New Game Instance</h2>
                <form id="add-instance-form">
                    <label for="condition">Condition:</label>
                    <select id="condition" required>
                        <option value="out-of-box">Out of Box</option>
                        <option value="in-box">In Box</option>
                        <option value="sealed">Sealed</option>
                    </select>
                    <label for="purchaseDate">Purchase Date:</label>
                    <input type="date" id="purchaseDate" required>
                    <label for="purchasePrice">Purchase Price:</label>
                    <input type="number" id="purchasePrice" step="0.01" required>
                    <label for="notes">Notes:</label>
                    <textarea id="notes"></textarea>
                    <button type="submit">Add Instance</button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);
    }
}



document.addEventListener('DOMContentLoaded', fetchPokemonGames);

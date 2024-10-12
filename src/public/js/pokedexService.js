const POKEMON_API_BASE_URL = 'https://pokeapi.co/api/v2';
const POKEBALL_ITEM_ID = 4; // ID for the standard Pokeball in the PokeAPI
const SILHOUETTE_STORAGE_KEY = 'pokemonSilhouettes';
const POKEBALL_CACHE_KEY = 'pokeballImageCache';

const pokemonDetailsCache = new Map();
const CACHE_EXPIRATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export async function getGameSpecificPokemon(gameId) {
    // Fetch game data
    const gameDataResponse = await fetch('/games/allgengames.json');
    const allGames = await gameDataResponse.json();
    const currentGame = allGames.find(game => game.id === gameId);
    
    if (!currentGame) {
        console.error(`Game with id ${gameId} not found`);
        return [];
    }

    const pokedexId = getPokedexIdForGame(gameId);
    const response = await fetch(`${POKEMON_API_BASE_URL}/pokedex/${pokedexId}`);
    const data = await response.json();
    
    // Filter and map Pokémon entries based on the game's Pokédex count
    return data.pokemon_entries
        .filter(entry => entry.entry_number <= currentGame.pokedex_count)
        .map(entry => ({
            id: entry.entry_number,
            name: entry.pokemon_species.name,
            status: 'unseen',
            url: entry.pokemon_species.url
        }));
}

function getPokedexIdForGame(gameId) {
    const pokedexMap = {
        'red-jp': 2, 'green-jp': 2, 'blue-jp': 2,
        'red-int': 2, 'blue-int': 2, 'yellow': 2, // Kanto Pokédex
        'gold': 3, 'silver': 3, 'crystal': 3, // Johto Pokédex
        'ruby': 4, 'sapphire': 4, 'emerald': 4, // Hoenn Pokédex
        // Add more mappings as needed
    };
    return pokedexMap[gameId] || 1; // Default to National Dex if game not found
}

export async function getPokemonDetails(pokemonName) {
    const now = Date.now();
    if (pokemonDetailsCache.has(pokemonName)) {
        const cachedData = pokemonDetailsCache.get(pokemonName);
        if (now - cachedData.timestamp < CACHE_EXPIRATION) {
            return cachedData.details;
        }
    }

    try {
        const response = await fetch(`${POKEMON_API_BASE_URL}/pokemon/${pokemonName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const details = {
            name: data.name,
            sprites: data.sprites,
            types: data.types,
            abilities: data.abilities,
            stats: data.stats,
            height: data.height,
            weight: data.weight,
        };
        pokemonDetailsCache.set(pokemonName, { details, timestamp: now });
        return details;
    } catch (error) {
        console.error(`Error fetching details for ${pokemonName}:`, error);
        return null;
    }
}

export function createPokemonElement(pokemonDetails, pokemon, index) {
    const element = document.createElement('div');
    element.className = 'pokemon-slot';
    element.setAttribute('data-id', pokemon.id);

    let spriteUrl;
    if (pokemon.status === 'unseen') {
        spriteUrl = getSilhouetteImage(pokemonDetails.sprites.front_default);
    } else if (pokemon.status === 'shiny') {
        spriteUrl = pokemonDetails.sprites.front_shiny || pokemonDetails.sprites.front_default;
    } else {
        spriteUrl = pokemonDetails.sprites.front_default;
    }

    element.innerHTML = `
        <img src="${spriteUrl}" alt="${pokemon.name}" class="pokemon-icon">
        <span class="pokemon-name">${pokemon.name}</span>
    `;

    element.addEventListener('click', () => showPokemonDetails(pokemon.id, [pokemon]));

    return element;
}

function getSilhouetteImage(originalImageUrl) {
    let silhouettes = JSON.parse(localStorage.getItem(SILHOUETTE_STORAGE_KEY)) || [];
    const existingSilhouette = silhouettes.find(s => s.original === originalImageUrl);
    
    if (existingSilhouette) {
        return existingSilhouette.silhouette;
    }

    // If silhouette doesn't exist, return a placeholder and create it asynchronously
    createSilhouetteAsync(originalImageUrl, silhouettes);
    return '/images/pokemon-silhouette-placeholder.png'; // Make sure this placeholder image exists in your project
}

function createSilhouetteAsync(originalImageUrl, silhouettes) {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // This helps with CORS issues
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'destination-atop';
        ctx.drawImage(img, 0, 0);
        
        const silhouetteUrl = canvas.toDataURL();
        silhouettes.push({ original: originalImageUrl, silhouette: silhouetteUrl });
        localStorage.setItem(SILHOUETTE_STORAGE_KEY, JSON.stringify(silhouettes));
        
        // Trigger a re-render of the Pokémon grid to update the silhouette
        if (window.updatePokemonGrid) {
            window.updatePokemonGrid();
        }
    };
    img.onerror = () => {
        console.error('Error loading image:', originalImageUrl);
    };
    img.src = originalImageUrl;
}

export async function showPokemonDetails(pokemonId, pokemonList) {
    const pokemon = pokemonList.find(p => p.id === pokemonId);
    if (!pokemon) {
        console.error('Pokemon not found');
        return;
    }

    const details = await getPokemonDetails(pokemon.name);
    if (!details) {
        console.error('Failed to fetch Pokemon details');
        return;
    }

    const detailsElement = document.getElementById('selected-pokemon');
    if (!detailsElement) {
        console.error('Details element not found');
        return;
    }

    let spriteUrl;
    if (pokemon.status === 'unseen') {
        spriteUrl = getSilhouetteImage(details.sprites.front_default);
    } else if (pokemon.status === 'shiny') {
        spriteUrl = details.sprites.front_shiny || details.sprites.front_default;
    } else {
        spriteUrl = details.sprites.front_default;
    }

    detailsElement.innerHTML = `
        <h3>${pokemon.name}</h3>
        <img src="${spriteUrl}" alt="${pokemon.name}" class="pokemon-detail-image">
        <p>Status: ${pokemon.status}</p>
        <p>Types: ${details.types.map(t => t.type.name).join(', ')}</p>
        <p>Height: ${details.height / 10} m</p>
        <p>Weight: ${details.weight / 10} kg</p>
        <h4>Abilities:</h4>
        <ul>
            ${details.abilities.map(a => `<li>${a.ability.name}</li>`).join('')}
        </ul>
        <h4>Stats:</h4>
        <ul>
            ${details.stats.map(s => `<li>${s.stat.name}: ${s.base_stat}</li>`).join('')}
        </ul>
    `;

    // Add buttons for changing Pokemon status
    const statusButtons = document.createElement('div');
    statusButtons.className = 'status-buttons';
    statusButtons.innerHTML = `
        <button onclick="handlePokemonStatusChange(${pokemon.id}, 'unseen')">Mark as Unseen</button>
        <button onclick="handlePokemonStatusChange(${pokemon.id}, 'seen')">Mark as Seen</button>
        <button onclick="handlePokemonStatusChange(${pokemon.id}, 'caught')">Mark as Caught</button>
        <button onclick="handlePokemonStatusChange(${pokemon.id}, 'shiny')">Mark as Shiny</button>
    `;
    detailsElement.appendChild(statusButtons);

    // Display catches
    const catchListElement = document.getElementById('catch-list');
    if (catchListElement) {
        const catches = await getPokemonCatches(pokemonId);
        catchListElement.innerHTML = '<h4>Catches:</h4>';
        if (catches.length > 0) {
            const catchList = document.createElement('ul');
            catches.forEach(catchItem => {  // Changed 'catch' to 'catchItem'
                const catchListItem = document.createElement('li');
                catchListItem.textContent = `Caught on ${catchItem.date} with ${catchItem.ball}`;
                catchList.appendChild(catchListItem);
            });
            catchListElement.appendChild(catchList);
        } else {
            catchListElement.innerHTML += '<p>No catches recorded yet.</p>';
        }
    }

    // Add new catch button
    const addCatchButton = document.createElement('button');
    addCatchButton.textContent = 'Add New Catch';
    addCatchButton.onclick = () => showAddCatchForm(pokemonId);
    detailsElement.appendChild(addCatchButton);
}

function showAddCatchForm(pokemonId) {
    const formElement = document.getElementById('add-catch-form');
    if (formElement) {
        formElement.style.display = 'block';
        formElement.innerHTML = `
            <h4>Add New Catch</h4>
            <form onsubmit="event.preventDefault(); addNewCatch(${pokemonId});">
                <label for="catchDate">Date:</label>
                <input type="date" id="catchDate" required><br>
                <label for="catchBall">Ball:</label>
                <input type="text" id="catchBall" required><br>
                <label for="catchNickname">Nickname:</label>
                <input type="text" id="catchNickname"><br>
                <label for="catchLevel">Level:</label>
                <input type="number" id="catchLevel" min="1" max="100" required><br>
                <button type="submit">Save Catch</button>
            </form>
        `;
    }
}

async function addNewCatch(pokemonId) {
    const catchDate = document.getElementById('catchDate').value;
    const catchBall = document.getElementById('catchBall').value;
    const catchNickname = document.getElementById('catchNickname').value;
    const catchLevel = document.getElementById('catchLevel').value;

    const catchData = {
        date: catchDate,
        ball: catchBall,
        nickname: catchNickname,
        level: parseInt(catchLevel, 10)
    };

    await saveCatch(pokemonId, catchData);
    document.getElementById('add-catch-form').style.display = 'none';
    showPokemonDetails(pokemonId, gameSpecificPokemon); // Refresh the details view
}

function updateStatComparison(pokemonId, baseStats, catches) {
    const avgStats = calculateAverageStats(catches);
    const comparisonElement = document.getElementById('stat-comparison');
    comparisonElement.innerHTML = `
        <h3>Stat Comparison</h3>
        <table>
            <tr>
                <th>Stat</th>
                <th>Base</th>
                <th>Average Catch</th>
            </tr>
            ${baseStats.map(s => `
                <tr>
                    <td>${s.stat.name}</td>
                    <td>${s.base_stat}</td>
                    <td>${avgStats[s.stat.name] || '-'}</td>
                </tr>
            `).join('')}
        </table>
    `;
}

function calculateAverageStats(catches) {
    const totalStats = {};
    catches.forEach(catchData => {
        Object.entries(catchData.stats).forEach(([stat, value]) => {
            totalStats[stat] = (totalStats[stat] || 0) + value;
        });
    });
    const avgStats = {};
    Object.entries(totalStats).forEach(([stat, total]) => {
        avgStats[stat] = Math.round(total / catches.length);
    });
    return avgStats;
}

// Implement these functions to handle individual catch management
window.addNewCatch = async function(pokemonId, gameSpecificPokemon) {
    try {
        console.log('Starting addNewCatch function');
        const newCatch = await promptForCatchDetails();
        console.log('New catch details:', newCatch);
        if (newCatch) {
            await saveCatch(pokemonId, newCatch);
            await showPokemonDetails(pokemonId, gameSpecificPokemon);
        }
        console.log('addNewCatch function completed');
    } catch (error) {
        console.error('Error in addNewCatch function:', error);
    }
};

window.editCatch = async function(catchId, pokemonId, gameSpecificPokemon) {
    const catchToEdit = await getIndividualCatch(catchId);
    const updatedCatch = await promptForCatchDetails(catchToEdit);
    if (updatedCatch) {
        await updateCatch(catchId, updatedCatch);
        showPokemonDetails(pokemonId, gameSpecificPokemon);
    }
};

window.deleteCatch = async function(catchId, pokemonId, gameSpecificPokemon) {
    if (confirm('Are you sure you want to delete this catch?')) {
        await deleteCatchFromDatabase(catchId);
        showPokemonDetails(pokemonId, gameSpecificPokemon);
    }
};

async function promptForCatchDetails(existingCatch = null) {
    try {
        console.log('Starting promptForCatchDetails');
        const nickname = prompt('Enter nickname (optional):', existingCatch?.nickname || '');
        const level = prompt('Enter level:', existingCatch?.level || '5');
        const ball = prompt('Enter ball type:', existingCatch?.ball || 'Pokeball');
        const date = prompt('Enter catch date (YYYY-MM-DD):', existingCatch?.date || new Date().toISOString().split('T')[0]);

        const stats = {};
        ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'].forEach(stat => {
            stats[stat] = parseInt(prompt(`Enter ${stat} stat:`, existingCatch?.stats[stat] || '0'), 10);
        });

        console.log('promptForCatchDetails completed');
        return { nickname, level: parseInt(level, 10), ball, date, stats };
    } catch (error) {
        console.error('Error in promptForCatchDetails:', error);
        return null;
    }
}

// Implement these functions to interact with your database
async function getIndividualCatches(pokemonId) {
    // Fetch catches from your database
    // For now, we'll return an empty array
    return [];
}

async function getIndividualCatch(catchId) {
    // Fetch a single catch from your database
    // For now, we'll return mock data
    return { id: catchId, date: '2023-04-01', ball: 'Pokeball', nickname: 'Sparky', level: 5, stats: { hp: 20, attack: 10, defense: 10, 'special-attack': 10, 'special-defense': 10, speed: 15 } };
}

async function saveCatch(pokemonId, catchData) {
    try {
        console.log('Saving catch:', pokemonId, catchData);
        // Implement the actual saving logic here
    } catch (error) {
        console.error('Error saving catch:', error);
    }
}

async function updateCatch(catchId, catchData) {
    // Update the catch in your database
    console.log('Updating catch:', catchId, catchData);
}

async function deleteCatchFromDatabase(catchId) {
    // Delete the catch from your database
    console.log('Deleting catch:', catchId);
}

export async function getPokeBallImage() {
    // Check cache first
    const cachedImage = localStorage.getItem(POKEBALL_CACHE_KEY);
    if (cachedImage) {
        return cachedImage;
    }

    try {
        const response = await fetch(`${POKEMON_API_BASE_URL}/item/${POKEBALL_ITEM_ID}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const imageUrl = data.sprites.default;
        
        // Cache the image URL
        localStorage.setItem(POKEBALL_CACHE_KEY, imageUrl);
        
        return imageUrl;
    } catch (error) {
        console.error('Error fetching Pokeball image:', error);
        return '/images/fallback-pokeball.png'; // Make sure this fallback image exists
    }
}

export async function addNewCatchToDatabase(pokemonId) {
    // Implement the logic to add a new catch to the database
    console.log('Adding new catch to database for Pokemon ID:', pokemonId);
    // This is where you'd typically interact with your backend or Firestore
    // For now, we'll just log it
}

// Add this function to update the grid when silhouettes are ready
export function updatePokemonGrid() {
    if (window.renderCurrentBox) {
        window.renderCurrentBox();
    }
}

// Make updatePokemonGrid available globally
window.updatePokemonGrid = updatePokemonGrid;

// Make sure to export the new functions
export { showAddCatchForm, addNewCatch };
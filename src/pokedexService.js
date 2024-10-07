import { createSilhouetteImage } from './ui.js';
import { currentGameId } from './pokebox.js'
import { loadPokemonDataFromLocalStorage, updatePokemonStatus } from './pokedex.js';
const BASE_URL = 'https://pokeapi.co/api/v2';

export async function fetchData(url) {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error('Error fetching data:', error);
		throw error;
	}
}

export async function getGameSpecificPokemon(gameName) {
	try {
		const versionData = await fetchData(
			`${BASE_URL}/version/${gameName.toLowerCase()}`
		);
		const versionGroupData = await fetchData(versionData.version_group.url);
		const pokedexData = await fetchData(versionGroupData.pokedexes[0].url);
        // const id = await fetchData(versionGroupData.pokemon_entries.id)
		// console.log(pokeDataName)

		return pokedexData.pokemon_entries.map((entry) => ({
			
            name: entry.pokemon_species.name,
			url: entry.pokemon_species.url,
            id: parseInt(entry.pokemon_species.url.split("/")[6])

		}));
	} catch (error) {
		console.error(`Error fetching game data for ${gameName}:`, error);
		throw error;
	}
}

export async function getPokemonDetails(pokemonName) {
    try {
        const baseData = await fetchData(`${BASE_URL}/pokemon/${pokemonName}`);
        
        // Create silhouette image
        const silhouetteImage = await createSilhouetteImage(baseData.sprites.front_default);
        // console.log(baseData)
        // Add silhouette image to the baseData
        return {
            ...baseData,
            silhouetteImage: silhouetteImage
        };
    } catch (error) {
        console.error(`Error fetching details for ${pokemonName}:`, error);
        throw error;
    }
    
}

export function createPokemonElement(pokemonData, gameData) {
 
    // let gameData = loadPokemonDataFromLocalStorage()
    // console.log(pokemonData.id-1)
    let index = gameData[pokemonData.id-1]
    // console.log(gameData)
    // console.log(pokemonData)
    // console.log(index)

    const element = document.createElement('div');
    element.classList.add(`pokemon-card`);
    element.setAttribute('id', `${index.status}`)
    
    // console.log(index.id)
    const pokeId = index.id
    element.dataset.id = pokeId
    let dataset = element.dataset.id
    dataset = parseInt(dataset)
    // console.log(dataset)
    // let boxIdMonId = index
    
    let imageSrc;
    // console.log(pokemonData)
    let statusClass = '';
    // console.log(pokemonData)
    // console.log(gameData)
    // console.log(index)
    // console.log(index)
    try {
        if (!index) {
            throw new Error('Game data is undefined');
        }

        if (index.status === 'shiny') {
            console.log('CURRENT STATUS SHINY')
            imageSrc = pokemonData.sprites.front_shiny;
            statusClass = 'shiny';
            index.status = 'shiny'
            
        } else if (!index.seen) {
            // console.log(boxIdMonId)
            imageSrc = pokemonData.silhouetteImage;
            statusClass = 'unseen';
            index.seen = 'unseen'
        } else if (index.status === 'caught') {
            // console.log(gameMon.status)
            imageSrc = pokemonData.sprites.front_default;
            statusClass = 'caught';
            index.status = 'caught'
        } else {
            // console.log(gameMon.status)
            imageSrc = pokemonData.sprites.front_default;
            statusClass = 'seen';
            index.status = 'seen'
        }

        if (!imageSrc) {
            throw new Error('Image source is undefined');
        }

        // console.log('Selected image:', imageSrc, 'Status:', statusClass);

        element.innerHTML = `
            <img src="${imageSrc}" alt="${pokemonData.name}">
            <p>${pokemonData.name}</p>
            ${index.status === 'caught' ? '<div class="pokeball-icon"></div>' : ''}
            ${index.status === 'shiny' ? '<div class="shiny-icon"></div>' : ''}
        `;
        element.classList.remove('seen', 'unseen', 'shiny', 'caught')
        element.classList.add(statusClass);

    } catch (error) {
        console.error('Error creating Pokemon element:', error);
        element.innerHTML = `<p>Error: ${index.name}</p>`;
        element.classList.add('error');
    }
    const boxIndex = dataset
    const pokemonId = index
    // console.log('Pokemon: ', pokemonId)
// console.log('Dataset: ', boxIndex)
    return element
}
// function createPokemonElement(gameData, universalData) {
// 	const pokemonElement = document.createElement('li');
// 	pokemonElement.classList.add('pokemon-card');
// 	pokemonElement.dataset.id = gameData.id;
// 	// console.log(gameData)
// 	let imageSrc;
// 	if (gameData.status === 'shiny') {
// 		imageSrc = universalData.imageShiny;
// 		// pokemonElement.classList.add('shiny');
// 	} else if (!gameData.seen) {
// 		imageSrc = universalData.silhouetteImage;
// 	} else {
// 		imageSrc = universalData.image;
// 	}
// 	pokemonElement.innerHTML = `
//         <img src="${imageSrc}" alt="${universalData.name}">
//         <p>${universalData.name}</p>
//         ${
// 					gameData.status === 'caught'
// 						? '<div class="pokeball-icon"></div>'
// 						: ''
// 				}
//         ${
// 					gameData.status === 'shiny' ? '<div class="pokeball-icon"></div>' : ''
// 				}
//     `;
// 	// pokemonElement.classList.add(gameData.status);
// 	return pokemonElement;
// }
export function renderPokebox(pokemonList) {
	const pokeboxElement = document.getElementById('pokebox');
	if (!pokeboxElement) {
		console.error('Pokebox element not found');
		return;
	}
	pokeboxElement.innerHTML = ''; // Clear existing content

	pokemonList.forEach((pokemon) => {
		const pokemonElement = createPokemonElement(pokemon);
		pokeboxElement.appendChild(pokemonElement);
	});
    
}

export function displayErrorMessage(message) {
	const errorElement = document.getElementById('error-message');
	if (errorElement) {
		errorElement.textContent = message;
	} else {
		console.error('Error message element not found. Message:', message);
		alert(message);
	}
}

export async function loadPokemonForGame(gameName) {
	try {
		const pokemonList = await getGameSpecificPokemon(gameName);
		const detailedPokemonList = await Promise.all(
			pokemonList.map((pokemon) => getPokemonDetails(pokemon.name))
		);
		renderPokebox(detailedPokemonList);
	} catch (error) {
		displayErrorMessage(
			`Failed to load Pokémon for ${gameName}: ${error.message}`
		);
	}
}

// export function init() {
// 	const gameSelector = document.getElementById('game-selector');
// 	if (gameSelector) {
// 		gameSelector.addEventListener('change', (event) => {
// 			const selectedGame = event.target.value;
// 			if (selectedGame) {
// 				loadPokemonForGame(selectedGame);
// 			}
// 		});
// 	} else {
// 		console.error('Game selector element not found');
// 	}
// }

// document.addEventListener('DOMContentLoaded', init);


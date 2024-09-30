import { pokemonData, loadPokemonDataFromLocalStorage, savePokemonDataToLocalStorage, fetchUserPokemonStatus } from './pokedex.js';
import { currentUser } from './auth.js';
import { displayPokemon, createSilhouetteImage } from './ui.js';

export function resetPokemonStatus() {
    pokemonData.forEach(pokemon => {
        pokemon.status = 'unseen';
        pokemon.seen = false;
    });
}

export function updatePokemonStatus(pokemonId, status) {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    let update = { [pokemonId]: status };

    if (status === 'caught' || status === 'shiny') {
        update[`${pokemonId}_seen`] = true;
    }

    updateDoc(userDocRef, update)
        .then(() => {
            const pokemon = pokemonData.find(p => p.id === pokemonId);
            if (pokemon) {
                pokemon.status = status;
                if (status === 'caught' || status === 'shiny') {
                    pokemon.seen = true;
                }
                displayPokemon();
            }
        })
        .catch((error) => {
            console.error('Error updating Pokemon status:', error);
        });
}

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                console.error(`Failed to parse JSON for ${url}:`, text);
                throw new Error(`JSON parse error: ${e.message}`);
            }
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 20 * (i + 1))); // Exponential backoff
        }
    }
}

export async function fetchPokemon() {
    const failedFetches = [];
    const successfulFetches = [];

    for (let i = 1; i <= 1025; i++) {
        const url = `https://pokeapi.co/api/v2/pokemon/${i}`;
        try {
            const data = await fetchWithRetry(url);
            successfulFetches.push(data);
        } catch (error) {
            console.error(`Failed to fetch Pokemon ${i}:`, error);
            failedFetches.push(i);
        }
    }

    // console.log(`Successfully fetched ${successfulFetches.length} Pokemon.`);
    // console.log(`Failed to fetch ${failedFetches.length} Pokemon:`, failedFetches);

    const newPokemonData = await Promise.all(successfulFetches.map(async (data) => {
        try {
            return {
                name: data.name,
                id: data.id,
                image: data.sprites['front_default'],
                imageShiny: data.sprites['front_shiny'],
                silhouetteImage: await createSilhouetteImage(data.sprites['front_default']),
                type: data.types.map(type => type.type.name).join(', '),
                hp: data.stats[0].base_stat,
                attack: data.stats[1].base_stat,
                defense: data.stats[2].base_stat,
                sp_atk: data.stats[3].base_stat,
                sp_def: data.stats[4].base_stat,
                speed: data.stats[5].base_stat,
                total: data.stats.reduce((sum, stat) => sum + stat.base_stat, 0),
                games: data.game_indices.map(gi => gi.version.name),
                status: 'unseen',
                seen: false
            };
        } catch (error) {
            console.error(`Error processing Pokemon ${data.id}:`, error);
            return null;
        }
    }));

    const validPokemonData = newPokemonData.filter(pokemon => pokemon !== null);
    pokemonData.push(...validPokemonData);
    savePokemonDataToLocalStorage();

    if (currentUser) {
        await fetchUserPokemonStatus();
    }
    
    displayPokemon();

    if (failedFetches.length > 0) {
        // console.warn(`Failed to fetch data for ${failedFetches.length} Pokemon. IDs: ${failedFetches.join(', ')}`);
        // Optionally, display a warning to the user
        alert(`Warning: Failed to fetch data for ${failedFetches.length} Pokemon. The list may be incomplete.`);
    }
};
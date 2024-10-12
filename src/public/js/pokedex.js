export let pokemonData = [];

export function loadPokemonDataFromLocalStorage() {
    const storedData = localStorage.getItem('pokemonData');
    return storedData ? JSON.parse(storedData) : [];
}

export function savePokemonDataToLocalStorage(data) {
    localStorage.setItem('pokemonData', JSON.stringify(data));
}

export function updatePokemonStatus(pokemonId, newStatus) {
    const pokemon = pokemonData.find(p => p.id === pokemonId);
    if (pokemon) {
        pokemon.status = newStatus;
        savePokemonDataToLocalStorage(pokemonData);
    }
}

export async function sendUpdatesToFirestore(data) {
    // Implement this function when you're ready to sync with Firestore
    console.log('Syncing with Firestore:', data);
}

export function fetchUserPokemonStatus() {
    // Implement this function when you're ready to fetch user-specific data
    console.log('Fetching user Pokemon status');
}

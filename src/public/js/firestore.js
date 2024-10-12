import { db, doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc } from './auth.js';
import { currentUser } from './auth.js';  // Add this import

export function updateFirestorePokemonStatus(gameId, pokemonId, status) {
    pendingUpdates[`${gameId}_${pokemonId}`] = { gameId, pokemonId, status };
    scheduleFirestoreUpdate();
}

let updateTimeout = null;
const UPDATE_DELAY = 5000; // 5 seconds

export function scheduleFirestoreUpdate() {
    if (updateTimeout) {
        clearTimeout(updateTimeout);
    }
    updateTimeout = setTimeout(() => syncWithFirestore(), UPDATE_DELAY);
}

export const pendingUpdates = {};

export async function syncWithFirestore(gameId, gameSpecificPokemon) {
    if (!currentUser) {
        console.log('User not authenticated, skipping sync');
        return;
    }
    if (!gameId || !gameSpecificPokemon) return;

    const userDocRef = doc(db, 'users', currentUser.uid, 'games', gameId);
    const pokemonData = {};

    gameSpecificPokemon.forEach(pokemon => {
        pokemonData[pokemon.id] = {
            name: pokemon.name,
            status: pokemon.status
        };
    });

    try {
        await setDoc(userDocRef, { pokemon: pokemonData }, { merge: true });
        console.log('Synced with Firestore successfully');
    } catch (error) {
        console.error('Error syncing with Firestore:', error);
        // Log more details about the error
        console.error('Error details:', error.code, error.message);
    }
}

export async function loadPokemonStatusFromFirestore(gameId) {
    if (!currentUser) return null;

    const userDocRef = doc(db, 'users', currentUser.uid, 'games', gameId);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return docSnap.data().pokemon || {};
        }
    } catch (error) {
        console.error('Error loading Pokemon status from Firestore:', error);
    }
    return null;
}

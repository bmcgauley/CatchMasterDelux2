import { db, doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc } from './auth.js';
import { currentUser } from './auth.js';  // Add this import

export function updateFirestorePokemonStatus() {
    // Implementation
}

export const UPDATE_INTERVAL = 5000; // or whatever value you want

export function scheduleFirestoreUpdate() {
    // Implementation
}

export const pendingUpdates = [];

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

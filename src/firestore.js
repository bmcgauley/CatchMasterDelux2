import { db, doc, getDoc, setDoc, currentUser } from './auth.js';
import { currentGameId } from './pokebox.js'

const UPDATE_INTERVAL = 1 * 6 * 1000; // 1 minute in milliseconds
let pendingUpdates = {};
let updateTimeout;


export async function updateFirestorePokemonStatus(pokemonId, updatedData) {
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

async function sendUpdatesToFirestore() {
	if (!currentUser || Object.keys(pendingUpdates).length === 0) {
		return;
	}
	const gameDocRef = doc(db, 'users', currentUser.uid, 'games', currentGameId);
	try {
		// Fetch the current document
		const docSnap = await getDoc(gameDocRef);
		let currentData = docSnap.exists() ? docSnap.data() : { pokemon: {} };

		// Ensure pokemon object exists
		if (!currentData.pokemon) {
			currentData.pokemon = {};
		}

		console.log('Pending updates:', pendingUpdates);

		// Merge pending updates with current data
		for (const [pokemonId, updates] of Object.entries(pendingUpdates)) {
			if (!currentData.pokemon[pokemonId]) {
				currentData.pokemon[pokemonId] = {};
			}
			Object.assign(currentData.pokemon[pokemonId], updates);
		}

		console.log('Sending updates to Firestore:', currentData);
		
		await setDoc(gameDocRef, currentData, { merge: true });
		console.log('Updates sent successfully');

		// Verify the update
		const updatedDocSnap = await getDoc(gameDocRef);
		console.log('Updated Firestore document:', updatedDocSnap.data());

		// Clear pending updates after successful send
		pendingUpdates = {};
	} catch (error) {
		console.error('Error updating Firestore:', error);
	}
}

// let updateTimeout;
export function scheduleFirestoreUpdate() {
	clearTimeout(updateTimeout);
	updateTimeout = setTimeout(sendUpdatesToFirestore, UPDATE_INTERVAL);
	console.log(
		`Firestore update scheduled in ${UPDATE_INTERVAL / 1000 / 60} minutes.`
	);
}

export { UPDATE_INTERVAL, pendingUpdates, currentGameId }
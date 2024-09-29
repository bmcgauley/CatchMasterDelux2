// import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import {db, getFirestore, doc, getDoc, setDoc, currentUser } from './auth.js';
import { displayPokemon } from './ui.js';

// let db = getFirestore();
let pokemonData = [];
let pendingUpdates = {};
const UPDATE_INTERVAL = 1 * 6 * 1000; // 5 minutes in milliseconds
const pokedex = document.getElementById('pokedex');


export function savePokemonDataToLocalStorage() {
    try {
        localStorage.setItem('pokemonData', JSON.stringify(pokemonData));
        console.log('Saved Pokemon data to local storage');
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
}

export function loadPokemonDataFromLocalStorage() {
    try {
        const storedData = localStorage.getItem('pokemonData');
        if (storedData) {
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error('Error loading from local storage:', error);
    }
    return null;
}

export async function sendUpdatesToFirestore() {
    if (!currentUser) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(userDocRef);
    
    let updates = {};
    let hasChanges = false;

    pokemonData.forEach(pokemon => {
        const firestoreData = docSnap.exists() ? docSnap.data()[pokemon.id] : null;
        if (!firestoreData || 
            firestoreData.status !== pokemon.status || 
            firestoreData.seen !== pokemon.seen) {
            updates[pokemon.id] = {
                status: pokemon.status,
                seen: pokemon.seen
            };
            hasChanges = true;
        }
    });

    if (hasChanges) {
        try {
            await setDoc(userDocRef, updates, {merge: true});
            console.log('Updates sent to Firestore successfully');
        } catch (error) {
            console.error('Error updating Firestore:', error);
        }
    } else {
        console.log('No changes to update in Firestore');
    }
}

export async function fetchUserPokemonStatus() {
    if (!currentUser) return pokemonData;

    const userDocRef = doc(db, 'users', currentUser.uid);

    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const userData = docSnap.data();
            return pokemonData.map(pokemon => ({
                ...pokemon,
                status: userData[pokemon.id]?.status || 'unseen',
                seen: userData[pokemon.id]?.seen || false
            }));
        } else {
            console.log('No user data found');
            return pokemonData;
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
        return pokemonData;
    }
}

export function handlePokemonClick(pokemonId, event) {
    event.preventDefault();
    const pokemon = pokemonData.find(p => p.id === parseInt(pokemonId));
    if (!pokemon) return;

    if (event.type === 'dblclick') {
        updatePokemonStatus(pokemonId, 'caught');
    } else {
        const statusCycle = ['unseen', 'seen'];
        const currentIndex = statusCycle.indexOf(pokemon.status);
        const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
        updatePokemonStatus(pokemonId, nextStatus);
    }

    savePokemonDataToLocalStorage();
    displayPokemon();
}

export function handlePokemonLongPress(pokemonId) {
    let pressTimer;
    return {
        start: (event) => {
            event.preventDefault();
            pressTimer = setTimeout(() => {
                updatePokemonStatus(pokemonId, 'shiny');
                savePokemonDataToLocalStorage();
                displayPokemon();
            }, 1000);
        },
        cancel: () => {
            clearTimeout(pressTimer);
        }
    };
}

export function updatePokemonStatus(pokemonId, status) {
    const pokemon = pokemonData.find(p => p.id === parseInt(pokemonId))
    
    if (pokemon.id) {
        pokemon.status = status;
        if (status === 'seen' || status === 'caught' || status === 'shiny') {
            pokemon.seen = true;
            sendUpdatesToFirestore(pokemon, status)
        } else if (status === 'unseen') {
            pokemon.seen = false;
            sendUpdatesToFirestore(pokemon, status)
        }
    }
    console.log(pokemon.id)
    savePokemonDataToLocalStorage();
    // sendUpdatesToFirestore(pokemonId, status); // Make sure this function is implemented to update Firestore
    displayPokemon();
}


export {   pokemonData, pendingUpdates };

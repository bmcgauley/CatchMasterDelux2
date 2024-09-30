// import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
import {db, getFirestore, doc, getDoc, setDoc, currentUser } from './auth.js';
import { displayPokemon } from './ui.js';
// import { boxData } from './pokebox.js';

// let db = getFirestore();
const pokemonData = [];
let pendingUpdates = {};
const UPDATE_INTERVAL = 1 * 6 * 1000; // 5 minutes in milliseconds
const pokedex = document.getElementById('pokedex');
const CLICK_DELAY = 300; // milliseconds
const LONG_PRESS_DELAY = 500; // milliseconds


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
            console.log('Loaded pokemonData from local storage:', JSON.parse(storedData));
            return JSON.parse(storedData);
        }
    } catch (error) {
        console.error('Error loading from local storage:', error);
    }
    return null;
}

let updateTimeout;

export function scheduleFirestoreUpdate() {
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(sendUpdatesToFirestore, UPDATE_INTERVAL);
}

export async function sendUpdatesToFirestore() {
    if (!currentUser || Object.keys(pendingUpdates).length === 0) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    
    try {
        await setDoc(userDocRef, pendingUpdates, { merge: true });
        console.log('Updates sent to Firestore successfully');
        pendingUpdates = {}; // Clear pending updates after successful send
    } catch (error) {
        console.error('Error updating Firestore:', error);
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

export function handlePokemonClick(pokemonId) {
    let clickTimer = null;
    let longPressTimer = null;
    let clickCount = 0;
    let isLongPress = false;

    return {
        start: (event) => {
            event.preventDefault();
            clickCount++;
            isLongPress = false;

            if (clickCount === 1) {
                longPressTimer = setTimeout(() => {
                    if (clickCount === 1) {
                        // Long press
                        isLongPress = true;
                        updatePokemonStatus(pokemonId, 'shiny');
                        // console.log('Long press activated');
                        clickCount = 0;
                    }
                }, LONG_PRESS_DELAY);
            }
        },
        end: (event) => {
            event.preventDefault();
            clearTimeout(longPressTimer);
            
            if (!isLongPress) {
                if (clickCount === 1) {
                    clickTimer = setTimeout(() => {
                        if (clickCount === 1) {
                            // Single click
                            const pokemon = pokemonData.find(p => p.id === parseInt(pokemonId));
                            const newStatus = pokemon.status === 'unseen' ? 'seen' : 'unseen';
                            updatePokemonStatus(pokemonId, newStatus);
                            // console.log('Single click activated');
                        }
                        clickCount = 0;
                    }, CLICK_DELAY);
                } else if (clickCount === 2) {
                    clearTimeout(clickTimer);
                    // Double click
                    updatePokemonStatus(pokemonId, 'caught');
                    // console.log('Double click activated');
                    clickCount = 0;
                }
            }
        },
        cancel: () => {
            clearTimeout(clickTimer);
            clearTimeout(longPressTimer);
            clickCount = 0;
            isLongPress = false;
        }
    };
}

export function updatePokemonStatus(pokemonId, status) {
    const pokemon = pokemonData.find(p => p.id === parseInt(pokemonId));
    
    if (pokemon) {
        pokemon.status = status;
        pokemon.seen = status !== 'unseen';
        
        pendingUpdates[pokemon.id] = {
            status: pokemon.status,
            seen: pokemon.seen
        };

        scheduleFirestoreUpdate();
        savePokemonDataToLocalStorage();
        displayPokemon();
    }
}


export {   pokemonData, pendingUpdates };

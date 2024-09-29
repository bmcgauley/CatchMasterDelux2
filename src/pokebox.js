import { pokemonData } from './pokedex.js';
import { currentUser, db } from './auth.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';

const POKEMON_PER_BOX = 20;
const BOXES_PER_GAME = 32;

export async function initializePokebox(game) {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();

    if (!userData.pokeboxes || !userData.pokeboxes[game]) {
        const newPokebox = Array(BOXES_PER_GAME).fill().map(() => Array(POKEMON_PER_BOX).fill(null));
        await setDoc(userDocRef, { pokeboxes: { [game]: newPokebox } }, { merge: true });
        return newPokebox;
    }

    return userData.pokeboxes[game];
}

export function renderPokebox(game, boxIndex, pokebox) {
    const boxHTML = pokebox[boxIndex].map((pokemon, slot) => {
        if (pokemon) {
            const pokemonData = getPokemonData(pokemon.id);
            return `
                <div class="box-slot" data-id="${pokemon.id}">
                    <img src="${pokemonData.image}" alt="${pokemonData.name}">
                    <span>${pokemonData.name}</span>
                </div>
            `;
        } else {
            return `<div class="box-slot empty"></div>`;
        }
    }).join('');

    return `
        <div class="pokebox">
            <h3>Box ${boxIndex + 1}</h3>
            <div class="box-container">
                ${boxHTML}
            </div>
        </div>
    `;
}

function getPokemonData(id) {
    return pokemonData.find(p => p.id === id) || { name: 'Unknown', image: '/images/unknown.png' };
}
import {
	fetchUserPokemonStatus,
	updatePokemonStatus,
	loadPokemonDataFromLocalStorage,
	savePokemonDataToLocalStorage,
	pokemonData,
	pendingUpdates,
	handlePokemonClick,
	handlePokemonLongPress,
} from './pokedex.js';
import { currentUser } from './auth.js';
// import { initializePokebox } from './pokebox.js';
// import { pokemonData } from './pokedex.js';

// At the top of ui.js, add:
let currentFilter = 'all';
let currentPage = 1;
const pokemonPerPage = 20;
export function updateMainDisplay() {
	const mainContainer = document.getElementById('main-container');
	if (!mainContainer) {
		console.error('Main container not found');
		return;
	}
	mainContainer.innerHTML = createSortingColumn() + '<div id="pokedex"></div>';
	displayPokemon();
}
function createSortingColumn() {
	const generations = {
		'Gen 1': [1, 151],
		'Gen 2': [152, 251],
		'Gen 3': [252, 386],
		'Gen 4': [387, 493],
		'Gen 5': [494, 649],
		'Gen 6': [650, 721],
		'Gen 7': [722, 809],
		'Gen 8': [810, 898],
	};

	const games = [...new Set(pokemonData.flatMap((p) => p.games))];

	let html = '<div id="sorting-column">';
	html += '<h3>Sort by Generation</h3>';
	for (const [gen, range] of Object.entries(generations)) {
		html += `<button onclick="window.filterByGeneration(${range[0]}, ${range[1]})">${gen}</button>`;
	}

	html += '<h3>Sort by Game</h3>';
	html += '<div class="game-covers">';
	for (const game of games) {
		html += `
            <div class="game-cover" onclick="window.filterByGame('${game}')">
                <img src="/images/game-covers/${game
									.toLowerCase()
									.replace(/\s+/g, '-')}.jpg" alt="${game} cover">
                <span>${game}</span>
            </div>
        `;
	}
	html += '</div></div>';

	return html;
}
function updateUIForSignedInUser() {
	document.getElementById('signInButton').style.display = 'none';
	document.getElementById('signOutButton').style.display = 'block';
	document.getElementById(
		'userDisplay'
	).textContent = `Welcome, ${currentUser.displayName}!`;
	fetchUserPokemonStatus();
}

function updateUIForSignedOutUser() {
	document.getElementById('signInButton').style.display = 'block';
	document.getElementById('signOutButton').style.display = 'none';
	document.getElementById('userDisplay').textContent = '';
	// pokemonData;
	// pendingUpdates;
	displayPokemon();
}

function getAppropriateImage(pokemon) {
	if (pokemon.status === 'unseen' || !pokemon.seen) {
		return pokemon.silhouetteImage;
	} else if (pokemon.status === 'shiny') {
		return pokemon.imageShiny;
	} else {
		return pokemon.image;
	}
}
/////////////////////////////////////////////////////////////////////////////////
//    Removed Stat Bars from Below
/////////////////////////////////////////////////////////////////////////////////
// <p>Games: ${pokemon.games.join(', ')}</p>
// ${createStatBar('Health', pokemon.hp)}
// ${createStatBar('Attack', pokemon.attack)}
// ${createStatBar('Defense', pokemon.defense)}
// ${createStatBar('Special Attack', pokemon.sp_atk)}
// ${createStatBar('Special Defense', pokemon.sp_def)}
// ${createStatBar('Speed', pokemon.speed)}
// <li class="pokemon-card ${pokemon.status} ${
//     pokemon.type.split(', ')[0]
// }" data-id="${pokemon.id}">
//     <img class="card-image" src="${getAppropriateImage(
//                         pokemon
//                     )}" alt="${pokemon.name}"/>
//     ${
//                         pokemon.status === 'caught'
//                             ? '<div class="pokeball-icon"></div>'
//                             : ''
//                     }
// <h2 class="card-title">${pokemon.id}. ${pokemon.name}</h2>
// <p class="card-subtitle">Type: ${pokemon.type}</p>
// <p>Status: ${pokemon.status}</p>

// ${createTotalBar('Total', pokemon.total)}

// </li>
export function displayPokemon() {
	// export function displayPokemon() {
	const filteredPokemon = filterPokemon();
	const totalPages = Math.ceil(filteredPokemon.length / pokemonPerPage);
	const startIndex = (currentPage - 1) * pokemonPerPage;
	const endIndex = startIndex + pokemonPerPage;
	const paginatedPokemon = filteredPokemon.slice(startIndex, endIndex);

	const pokemonHTMLString = paginatedPokemon
		.map(
			(pokemon) => `
            <li class="pokemon-card ${pokemon.status} ${
				pokemon.type.split(', ')[0]
			}" data-id="${pokemon.id}">
    <img class="card-image" src="${getAppropriateImage(pokemon)}" alt="${
				pokemon.name
			}"/>
    ${pokemon.status === 'caught' ? '<div class="pokeball-icon"></div>' : ''}


</li>
    `
		)
		.join('');

	const paginationHTML = `
        <div class="pagination">
            <button class="nav-button prev" onclick="prevPage()" ${
							currentPage === 1 ? 'disabled' : ''
						}>◀</button>
            <span>Page ${currentPage} of ${totalPages}</span>
            <button class="nav-button next" onclick="nextPage()" ${
							currentPage === totalPages ? 'disabled' : ''
						}>▶</button>
        </div>
    `;

	document.getElementById('pokedex').innerHTML = `
        <div class="pokedex-grid">
            ${pokemonHTMLString}
        </div>
        ${paginationHTML}
    `;
	// document.getElementById('pokedex').innerHTML = pokemonHTMLString;

	// Add event listeners
	document.querySelectorAll('.pokemon-card').forEach((card) => {
		const pokemonId = card.getAttribute('data-id');
		card.addEventListener('click', (e) => handlePokemonClick(pokemonId, e));
		card.addEventListener('dblclick', (e) => handlePokemonClick(pokemonId, e));
		const longPress = handlePokemonLongPress(pokemonId);
		card.addEventListener('mousedown', longPress.start);
		card.addEventListener('touchstart', longPress.start);
		card.addEventListener('mouseup', longPress.cancel);
		card.addEventListener('mouseleave', longPress.cancel);
		card.addEventListener('touchend', longPress.cancel);
	});
	window.prevPage = function () {
		if (currentPage > 1) {
			currentPage--;
			displayPokemon();
		}
	};

	window.nextPage = function () {
		const totalPages = Math.ceil(filterPokemon().length / pokemonPerPage);
		if (currentPage < totalPages) {
			currentPage++;
			displayPokemon();
		}
	};
}

// Update the filterPokemon function:
function filterPokemon() {
	return pokemonData.filter((p) => {
		if (currentFilter === 'all') return true;
		if (currentFilter === 'seen')
			return (
				p.status === 'seen' || p.status === 'caught' || p.status === 'shiny'
			);
		if (currentFilter === 'caught')
			return p.status === 'caught' || p.status === 'shiny';
		if (currentFilter === 'missing') return p.status === 'unseen';
		if (typeof currentFilter === 'function') return currentFilter(p);
		return true;
	});
}

// Make sure to export the updateFilter function:
export function updateFilter(filter) {
	currentFilter = filter;
	displayPokemon();
}

function createSilhouetteImage(spriteUrl) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.crossOrigin = 'Anonymous'; // To avoid CORS issues
		img.src = spriteUrl;

		img.onload = () => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');

			canvas.width = img.width;
			canvas.height = img.height;

			ctx.drawImage(img, 0, 0);

			const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const data = imageData.data;

			// Apply a black overlay only to non-transparent pixels
			for (let i = 0; i < data.length; i += 4) {
				if (data[i + 3] > 0) {
					// Check alpha channel
					data[i] = 0; // Red
					data[i + 1] = 0; // Green
					data[i + 2] = 0; // Blue
					data[i + 3] = 255; // Alpha
				}
			}

			ctx.putImageData(imageData, 0, 0);

			resolve(canvas.toDataURL());
		};

		img.onerror = (error) => {
			reject(error);
		};
	});
}

function filterByGeneration(start, end) {
	currentFilter = (pokemon) => pokemon.id >= start && pokemon.id <= end;
	displayPokemon();
}

function filterByGame(game) {
	currentFilter = (pokemon) => pokemon.games.includes(game);
	displayPokemon();
}

function createTotalBar(label, value) {
	const maxTotal = 600; // Assuming 600 as max total stats
	const percentage = (value / maxTotal) * 100;
	return `
        <div class="stat-bar">
            <span>${label}: ${value}</span>
            <div class="bar-fill" style="width: ${percentage}%"></div>
        </div>
    `;
}

function createStatBar(label, value) {
	const maxStat = 255; // Max individual stat value
	const percentage = (value / maxStat) * 100;
	return `
        <div class="stat-bar">
            <span>${label}: ${value}</span>
            <div class="bar-fill" style="width: ${percentage}%"></div>
        </div>
    `;
}

// function displayPokebox(game) {
//     const pokeboxContainer = document.getElementById('pokebox-container');
//     initializePokebox(game).then(pokebox => {
//         const boxesHTML = pokebox.map((_, index) => renderPokebox(game, index, pokebox)).join('');
//         pokeboxContainer.innerHTML = `
//             <h2>${game} Pokébox</h2>
//             <div class="boxes-container">
//                 ${boxesHTML}
//             </div>
//         `;
//     });
// }

window.filterByGeneration = function (start, end) {
	updateFilter((pokemon) => pokemon.id >= start && pokemon.id <= end);
};

window.filterByGame = function (game) {
	updateFilter((pokemon) => pokemon.games.includes(game));
};
export {
	updateUIForSignedInUser,
	updateUIForSignedOutUser,
	createSilhouetteImage,
	createTotalBar,
	createStatBar,
};

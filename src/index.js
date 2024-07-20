import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-analytics.js';
import {
	getAuth,
	onAuthStateChanged,
	GoogleAuthProvider,
	signInWithPopup,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js';
import {
    getFirestore,
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js';
const firebaseApp = {
	apiKey: 'AIzaSyA0Nrmbjb297EbKLaBxyBpMEUeWXjgbGUU',
	authDomain: 'catchmaster-delux.firebaseapp.com',
	projectId: 'catchmaster-delux',
	storageBucket: 'catchmaster-delux.appspot.com',
	messagingSenderId: '840913142770',
	appId: '1:840913142770:web:c72e0087fac8854bd1616b',
	measurementId: 'G-XVGLX2EJZH',
};
// Initialize Firebase
const app = initializeApp(firebaseApp);
//init db
const db = getFirestore(app);
// Reference to a collection
const usersCollection = collection(db, 'users');

// Reference to a document
const userDoc = doc(db, 'users', 'userId');

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);



//init vars
let currentUser = null;
let pokemonData = [];
let currentFilter = 'all';
let currentGeneration = 'all';
let pendingUpdates = {};

// Authentication functions
function signIn() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            const user = result.user;
            currentUser = user;
            updateUIForSignedInUser(user);
            createUserDocument(user);
            fetchPokemon().then(() => fetchUserPokemonStatus());
        })
        .catch((error) => {
            console.error('Error during sign in:', error);
        });
}

async function createUserDocument(user) {
    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
        try {
            await setDoc(userDocRef, {
                email: user.email,
                displayName: user.displayName,
                // You can add more default fields here if needed
            });
            console.log("User document created successfully");
        } catch (error) {
            console.error("Error creating user document:", error);
        }
    }
}

function signOutUser() {
    auth.signOut()
        .then(() => {
            currentUser = null;
            updateUIForSignedOutUser();
            clearLocalStorage();
            location.reload();
        })
        .catch((error) => {
            console.error('Error during sign out:', error);
        });
}

function clearLocalStorage() {
    try {
        localStorage.removeItem('pokemonData');
        localStorage.removeItem('pendingUpdates');
        console.log('Local storage cleared successfully');
    } catch (error) {
        console.error('Error clearing local storage:', error);
    }
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
    // document.getElementById('statusFilter').textContent = 'all';
    // Reset Pokemon data
    pokemonData = [];
    pendingUpdates = {};
    
    // Refresh the display
    displayPokemon();
}

function updatePokemonStatus(pokemonId, status) {
    if (!currentUser) return;

    // Update locally first
    const pokemon = pokemonData.find(p => p.id === parseInt(pokemonId));
    if (pokemon) {
        pokemon.status = status;
        if (status === 'caught' || status === 'shiny') {
            pokemon.seen = true;
        }
    }

    // Queue the update
    pendingUpdates[pokemonId] = status;

    // Save to local storage
    savePokemonDataToLocalStorage();

    // Debounce the Firestore update
    clearTimeout(window.updateTimeout);
    window.updateTimeout = setTimeout(sendUpdatesToFirestore, 2000);

    // Refresh the display immediately
    displayPokemon();
}

function savePokemonDataToLocalStorage() {
    try {
        localStorage.setItem('pokemonData', JSON.stringify(pokemonData));
        localStorage.setItem('pendingUpdates', JSON.stringify(pendingUpdates));
        console.log('Saved Pokemon data to local storage');
    } catch (error) {
        console.error('Error saving to local storage:', error);
    }
}

function loadPokemonDataFromLocalStorage() {
    try {
        const storedData = localStorage.getItem('pokemonData');
        const storedUpdates = localStorage.getItem('pendingUpdates');
        if (storedData) {
            pokemonData = JSON.parse(storedData);
        }
        if (storedUpdates) {
            pendingUpdates = JSON.parse(storedUpdates);
        }
        console.log('Loaded Pokemon data from local storage');
    } catch (error) {
        console.error('Error loading from local storage:', error);
    }
}

async function sendUpdatesToFirestore() {
    if (Object.keys(pendingUpdates).length === 0) return;

    if (!navigator.onLine) {
        console.log('Offline, updates will be sent when online');
        return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);
    let update = {};

    for (const [pokemonId, status] of Object.entries(pendingUpdates)) {
        update[pokemonId] = status;
        if (status === 'caught' || status === 'shiny') {
            update[`${pokemonId}_seen`] = true;
        }
    }

    try {
        // Use setDoc with merge option instead of updateDoc
        await setDoc(userDocRef, update, { merge: true });
        console.log('Updates sent to Firestore successfully');
        pendingUpdates = {}; // Clear pending updates after successful send
        savePokemonDataToLocalStorage(); // Save the cleared pending updates
    } catch (error) {
        console.error('Error updating Firestore:', error);
        // Keep the pending updates for next try
    }
}
function fetchUserPokemonStatus() {
    if (!currentUser) return;

    if (!navigator.onLine) {
        console.log('Offline, using local data');
        loadPokemonDataFromLocalStorage();
        displayPokemon();
        return;
    }

    const userDocRef = doc(db, 'users', currentUser.uid);

    getDoc(userDocRef)
        .then((docSnap) => {
            if (docSnap.exists()) {
                const userData = docSnap.data();
                pokemonData.forEach((pokemon) => {
                    pokemon.status = userData[pokemon.id] || pokemon.status || 'unseen';
                    pokemon.seen = userData[`${pokemon.id}_seen`] || pokemon.seen || false;
                });
                savePokemonDataToLocalStorage();
                displayPokemon();
            } else {
                console.log('No user data found');
                displayPokemon();
            }
        })
        .catch((error) => {
            console.error('Error fetching user data:', error);
            loadPokemonDataFromLocalStorage();
            displayPokemon();
        });
}

function handlePokemonClick(pokemonId, event) {
	const pokemon = pokemonData.find((p) => p.id === pokemonId);
	if (!pokemon) return;

	if (event.type === 'click') {
		if (pokemon.status === 'unseen') {
			updatePokemonStatus(pokemonId, 'seen');
		} else {
			updatePokemonStatus(pokemonId, 'unseen');
		}
	} else if (event.type === 'dblclick') {
		updatePokemonStatus(pokemonId, 'caught');
	}
}

function handlePokemonLongPress(pokemonId) {
	let pressTimer;
	const pokemon = pokemonData.find((p) => p.id === pokemonId);
	if (!pokemon) return;

	return {
		start: () => {
			pressTimer = setTimeout(() => {
				updatePokemonStatus(pokemonId, 'shiny');
			}, 3000);
		},
		cancel: () => {
			clearTimeout(pressTimer);
		},
	};
}

//     const container = document.getElementById('pokemon-container');
//     container.innerHTML = '';

//     pokemonData.forEach(pokemon => {
//         const pokemonElement = document.createElement('div');
//         pokemonElement.classList.add('pokemon');

//         const img = document.createElement('img');
//         if (pokemon.status === 'unseen' && !pokemon.seen) {
//             img.src = pokemon.silhouetteImage; // You'll need to add silhouette images to your pokemonData
//         } else {
//             img.src = pokemon.image;
//         }
//         img.alt = pokemon.name;

//         const nameElement = document.createElement('p');
//         nameElement.textContent = pokemon.name;

//         pokemonElement.appendChild(img);
//         pokemonElement.appendChild(nameElement);

//         pokemonElement.addEventListener('click', (e) => handlePokemonClick(pokemon.id, e));
//         pokemonElement.addEventListener('dblclick', (e) => handlePokemonClick(pokemon.id, e));

//         const longPress = handlePokemonLongPress(pokemon.id);
//         pokemonElement.addEventListener('mousedown', longPress.start);
//         pokemonElement.addEventListener('touchstart', longPress.start);
//         pokemonElement.addEventListener('mouseup', longPress.cancel);
//         pokemonElement.addEventListener('mouseleave', longPress.cancel);
//         pokemonElement.addEventListener('touchend', longPress.cancel);

//         container.appendChild(pokemonElement);
//     });
// }

// Existing functions (createStatBar, createTotalBar, getColorForStat) remain unchanged
function populateGameFilter() {
	const gameSet = new Set();
	pokemonData.forEach((pokemon) => {
		pokemon.games.forEach((game) => gameSet.add(game));
	});
}
const pokedex = document.getElementById('pokedex');


const fetchPokemon = async () => {
    try {
        loadPokemonDataFromLocalStorage();
        if (pokemonData.length > 0) {
            console.log('Loaded Pokemon data from local storage');
            if (currentUser) {
                fetchUserPokemonStatus();
            } else {
                displayPokemon();
            }
            return;
        }

        console.log('Fetching Pokemon data from API...');
        const promises = [];
        for (let i = 1; i <= 1025; i++) {
            const url = `https://pokeapi.co/api/v2/pokemon/${i}`;
            promises.push(fetch(url).then(res => res.json()));
        }

        const results = await Promise.all(promises);
        pokemonData = await Promise.all(results.map(async data => {
            const silhouetteImage = await createSilhouetteImage(data.sprites['front_default']);
            return {
                name: data.name,
                id: data.id,
                image: data.sprites['front_default'],
                imageShiny: data.sprites['front_shiny'],
                silhouetteImage: silhouetteImage, // Use the silhouette image
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
        }));

        savePokemonDataToLocalStorage();

        if (currentUser) {
            fetchUserPokemonStatus();
        } else {
            displayPokemon();
        }
    } catch (error) {
        console.error('Error fetching Pokemon data:', error);
        loadPokemonDataFromLocalStorage();
        displayPokemon();
    }
};

const createSilhouetteImage = (spriteUrl) => {
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
                if (data[i + 3] > 0) { // Check alpha channel
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
};

function createTotalBar(totalName, totalValue) {
	const tpercentage = (totalValue / 1024) * 100; // 255 is max stat value
	const color = getColorForStat(tpercentage);
	return `
            <div class="stat-label">
                <span>${totalName}</span>
                <span>${totalValue}</span>
            </div>
            <div class="stat-bar">
                <div class="stat-bar-fill" style="width: ${tpercentage}%; background-color: ${color};"></div>
            </div>
        `;
}
function createStatBar(statName, statValue) {
	const percentage = (statValue / 255) * 100; // 255 is max stat value
	const color = getColorForStat(percentage);
	return `
            <div class="stat-label">
                <span>${statName}</span>
                <span>${statValue}</span>
            </div>
            <div class="stat-bar">
                <div class="stat-bar-fill" style="width: ${percentage}%; background-color: ${color};"></div>
            </div>
       `;
}
function getColorForStat(percentage) {
	if (percentage < 30) return '#ff4d4d'; // Red for low stats
	if (percentage < 60) return '#ffd700'; // Gold for medium stats
	return '#00cc44'; // Green for high stats
}
function displayPokemon() {
    if (!pokemonData || pokemonData.length === 0) {
        console.error('No Pokemon data available');
        return;
    }

    const filteredPokemon = filterPokemon();
    const pokemonHTMLString = filteredPokemon.map(pokeman => `
        <li class="pokemon-card" data-id="${pokeman.id}">
            <img class="card-image" src="${pokeman.status === 'unseen' && !pokeman.seen ? pokeman.silhouetteImage : pokeman.image}"/>
            <h2 class="card-title">${pokeman.id}. ${pokeman.name}</h2>
            <p class="card-subtitle">Type: ${pokeman.type}</p>
            <p>Status: ${pokeman.status}</p>
            <p>Games: ${pokeman.games.join(', ')}</p>
            ${createTotalBar('Total', pokeman.total)}
            ${createStatBar('Health', pokeman.hp)}
            ${createStatBar('Attack', pokeman.attack)}
            ${createStatBar('Defense', pokeman.defense)}
            ${createStatBar('Special Attack', pokeman.sp_atk)}
            ${createStatBar('Special Defense', pokeman.sp_def)}
            ${createStatBar('Speed', pokeman.speed)}
            ${currentUser ? `
                <select class="status-select" onchange="updatePokemonStatus('${pokeman.id}', this.value)">
                    <option value="unseen" ${pokeman.status === 'unseen' ? 'selected' : ''}>Unseen</option>
                    <option value="seen" ${pokeman.status === 'seen' ? 'selected' : ''}>Seen</option>
                    <option value="caught" ${pokeman.status === 'caught' ? 'selected' : ''}>Caught</option>
                    <option value="shiny" ${pokeman.status === 'shiny' ? 'selected' : ''}>Shiny</option>
                </select>
            ` : ''}
        </li>
    `).join('');
    pokedex.innerHTML = pokemonHTMLString;

    document.querySelectorAll('.pokemon-card').forEach(card => {
        const pokemonId = card.getAttribute('data-id');
        card.addEventListener('click', (e) => handlePokemonClick(pokemonId, e));
        card.addEventListener('dblclick', (e) => handlePokemonClick(pokemonId, e));
        const longPress = handlePokemonLongPress(pokemonId);
        if (longPress && longPress.start && longPress.cancel) {
            card.addEventListener('mousedown', longPress.start);
            card.addEventListener('touchstart', longPress.start);
            card.addEventListener('mouseup', longPress.cancel);
            card.addEventListener('mouseleave', longPress.cancel);
            card.addEventListener('touchend', longPress.cancel);
        }
    });
}
function filterPokemon() {
    if (!pokemonData) return [];
    return pokemonData.filter(p => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'seen') return p.status === 'seen' || p.status === 'caught' || p.status === 'shiny';
        if (currentFilter === 'caught') return p.status === 'caught' || p.status === 'shiny';
        if (currentFilter === 'missing') return p.status === 'unseen';
        return true;
    });
}
console.log(pokemonData)
function updateFilter(filter) {
	currentFilter = filter;
	displayPokemon(pokemonData);
}
function resetPokemonStatus() {
    if (pokemonData && pokemonData.length > 0) {
        pokemonData.forEach(pokemon => {
            pokemon.status = 'unseen';
            pokemon.seen = false;
        });
    }
}
// ... rest of your code (displayPokemon, filterPokemon, getGeneration, etc.) ...

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    fetchPokemon();
});
// Firebase Auth state change listener
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        updateUIForSignedInUser();
    } else {
        currentUser = null;
        updateUIForSignedOutUser();
        
    }
});
// Event listeners
document.getElementById('signInButton').addEventListener('click', signIn);
document.getElementById('signOutButton').addEventListener('click', signOutUser);

// Firebase Auth state change listener
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        updateUIForSignedInUser();
    } else {
        currentUser = null;
        updateUIForSignedOutUser();
    }
});
// Online/Offline event listeners
window.addEventListener('online', () => {
    console.log('Back online, sending pending updates');
    sendUpdatesToFirestore();
});

window.addEventListener('offline', () => {
    console.log('Went offline, updates will be stored locally');
});
// Make functions available globally
window.updateFilter = updateFilter;
window.updatePokemonStatus = updatePokemonStatus;
window.clearPokemonData = clearPokemonData;

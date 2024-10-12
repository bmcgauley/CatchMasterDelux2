import { currentUser } from './auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, addDoc, deleteDoc } from './auth.js';

const gameLocations = {
  all: '/games/allgengames.json'
};

let pokemonGames = [];
let lastSyncTime = 0;
const SYNC_INTERVAL = 60 * 1000; // 1 minute

export async function initGames() {
  try {
    await fetchPokemonGames();
    loadUserOwnedGamesFromLocalStorage();
    displayGames();
    if (currentUser) {
      await syncWithFirestore();
    }
    setupSyncEvents();
  } catch (error) {
    console.error('Error initializing games:', error);
  }
}

async function fetchPokemonGames() {
  try {
    const response = await fetch(gameLocations.all);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    pokemonGames = data;
  } catch (error) {
    console.error('Error fetching game data:', error);
    throw error;
  }
}

function loadUserOwnedGamesFromLocalStorage() {
  const localGames = JSON.parse(localStorage.getItem('ownedGames')) || {};
  pokemonGames.forEach(game => {
    game.copies = localGames[game.id] || [];
  });
  console.log('Loaded games from local storage:', localGames);
}

function saveUserOwnedGamesToLocalStorage() {
  const ownedGames = {};
  pokemonGames.forEach(game => {
    if (game.copies && game.copies.length > 0) {
      ownedGames[game.id] = game.copies;
    }
  });
  localStorage.setItem('ownedGames', JSON.stringify(ownedGames));
  console.log('Saved games to local storage:', ownedGames);
}

async function syncWithFirestore() {
  if (!currentUser) return;

  const now = Date.now();
  if (now - lastSyncTime < SYNC_INTERVAL) {
    console.log('Skipping sync, too soon since last sync');
    return;
  }

  const db = getFirestore();
  const userGamesRef = doc(db, 'users', currentUser.uid, 'games', 'owned');
  
  try {
    const docSnap = await getDoc(userGamesRef);
    if (docSnap.exists()) {
      const firestoreGames = docSnap.data().games || {};
      const localGames = JSON.parse(localStorage.getItem('ownedGames')) || {};

      // Merge Firestore data with local data
      Object.entries(firestoreGames).forEach(([gameId, copies]) => {
        if (!localGames[gameId]) {
          localGames[gameId] = copies;
        } else {
          // Merge copies, avoiding duplicates
          const localCopyIds = new Set(localGames[gameId].map(c => c.instanceId));
          copies.forEach(copy => {
            if (!localCopyIds.has(copy.instanceId)) {
              localGames[gameId].push(copy);
            }
          });
        }
      });

      // Update local storage and pokemonGames
      localStorage.setItem('ownedGames', JSON.stringify(localGames));
      pokemonGames.forEach(game => {
        game.copies = localGames[game.id] || [];
      });

      // Update Firestore with the merged data
      await setDoc(userGamesRef, { games: localGames }, { merge: true });

      console.log('Synced with Firestore:', localGames);
      displayGames(); // Refresh the display after syncing
    }
    lastSyncTime = now;
  } catch (error) {
    console.error('Error syncing with Firestore:', error);
  }
}

function displayGames() {
  const gamesContainer = document.getElementById('games');
  gamesContainer.innerHTML = '';

  pokemonGames.forEach(game => {
    const gameElement = document.createElement('div');
    gameElement.className = 'game-card';
    gameElement.innerHTML = `
      <h3>${game.name}</h3>
      <img src="${game.box_art_url}" alt="${game.name} Box Art" class="game-box-art">
      <p>Region: ${game.region}</p>
      <p>Release Date: ${game.release_date}</p>
      <p>Platform: ${game.platform}</p>
      <p>Pokédex Count: ${game.pokedex_count}</p>
      <p>Original Price: $${game.original_price}</p>
      <div class="owned-copies">
        <h4>Owned Copies:</h4>
        ${displayOwnedCopies(game)}
      </div>
      <div class="add-copy">
        <input type="number" id="price-${game.id}" placeholder="Price paid">
        <input type="date" id="date-${game.id}">
        <select id="condition-${game.id}">
          <option value="new">New</option>
          <option value="used">Used</option>
          <option value="sealed">Sealed</option>
        </select>
        <button onclick="toggleOwnedGame('${game.id}')">Add Copy</button>
        <span class="sync-checkbox hidden" id="sync-${game.id}" onclick="syncGame('${game.id}')">&#9744;</span>
      </div>
    `;
    gamesContainer.appendChild(gameElement);
    updateSyncCheckboxStatus(game.id);
  });
}

function displayOwnedCopies(game) {
  if (!game.copies || game.copies.length === 0) {
    return '<p>No copies owned</p>';
  }

  return game.copies.map(copy => `
    <div class="owned-copy">
      <p>Paid: $${(copy.pricePaid || 0).toFixed(2)}</p>
      <p>Purchased: <input type="date" value="${copy.purchaseDate || ''}" onchange="updatePurchaseDate('${game.id}', '${copy.instanceId}', this.value)"></p>
      <p>Condition: ${copy.condition}</p>
      <button onclick="navigateToPokeBox('${game.id}', '${copy.instanceId}')">Manage Pokébox</button>
      <button onclick="removeCopy('${game.id}', '${copy.instanceId}')">Remove Copy</button>
    </div>
  `).join('');
}

async function toggleOwnedGame(gameId) {
  if (!currentUser) {
    alert('Please sign in to manage your game collection.');
    return;
  }

  const priceInput = document.getElementById(`price-${gameId}`);
  const dateInput = document.getElementById(`date-${gameId}`);
  const conditionSelect = document.getElementById(`condition-${gameId}`);

  const newCopy = {
    pricePaid: parseFloat(priceInput.value) || 0,
    purchaseDate: dateInput.value || new Date().toISOString().split('T')[0],
    condition: conditionSelect.value,
    instanceId: Date.now().toString(),
    boxes: []
  };

  const game = pokemonGames.find(g => g.id === gameId);
  if (game) {
    if (!game.copies) game.copies = [];
    game.copies.push(newCopy);
    saveUserOwnedGamesToLocalStorage();
    displayGames(); // Refresh the display
  }

  // Clear input fields
  priceInput.value = '';
  dateInput.value = '';
  conditionSelect.value = 'new';

  updateSyncCheckboxStatus(gameId);
  showSyncCheckbox(gameId);
}

async function syncGame(gameId) {
  if (!currentUser) return;

  const syncCheckbox = document.getElementById(`sync-${gameId}`);
  syncCheckbox.innerHTML = '&#9744;'; // Empty checkbox
  syncCheckbox.classList.add('syncing');

  const db = getFirestore();
  const userGamesRef = doc(db, 'users', currentUser.uid, 'games', 'owned');
  
  try {
    const docSnap = await getDoc(userGamesRef);
    const firestoreGames = docSnap.exists() ? docSnap.data().games || {} : {};
    const localGames = JSON.parse(localStorage.getItem('ownedGames')) || {};

    firestoreGames[gameId] = localGames[gameId] || [];

    await setDoc(userGamesRef, { games: firestoreGames }, { merge: true });
    console.log(`Synced game ${gameId} with Firestore`);
    
    syncCheckbox.innerHTML = '&#9745;'; // Checked checkbox
    syncCheckbox.classList.remove('syncing');
    syncCheckbox.classList.add('synced');

    setTimeout(() => {
      syncCheckbox.classList.add('fade-out');
      setTimeout(() => {
        syncCheckbox.classList.add('hidden');
        syncCheckbox.classList.remove('fade-out', 'synced');
      }, 1000); // Match this with the CSS transition time
    }, 2000); // Show the green checkmark for 2 seconds before fading

  } catch (error) {
    console.error(`Error syncing game ${gameId} with Firestore:`, error);
    syncCheckbox.classList.remove('syncing');
    syncCheckbox.classList.add('error');
  }
}

function updateSyncCheckboxStatus(gameId) {
  const syncCheckbox = document.getElementById(`sync-${gameId}`);
  const localGames = JSON.parse(localStorage.getItem('ownedGames')) || {};
  const game = localGames[gameId];

  if (game && game.length > 0 && !game.synced) {
    showSyncCheckbox(gameId);
  } else {
    hideSyncCheckbox(gameId);
  }
}

function showSyncCheckbox(gameId) {
  const syncCheckbox = document.getElementById(`sync-${gameId}`);
  syncCheckbox.classList.remove('hidden', 'synced', 'fade-out');
  syncCheckbox.innerHTML = '&#9744;'; // Empty checkbox
}

function hideSyncCheckbox(gameId) {
  const syncCheckbox = document.getElementById(`sync-${gameId}`);
  syncCheckbox.classList.add('hidden');
}

function navigateToPokeBox(gameId, instanceId) {
  window.location.href = `/pokebox?game=${gameId}&instance=${instanceId}`;
}

async function removeCopy(gameId, instanceId) {
  const game = pokemonGames.find(g => g.id === gameId);
  if (game) {
    game.copies = game.copies.filter(c => c.instanceId !== instanceId);
    saveUserOwnedGamesToLocalStorage();
    displayGames(); // Refresh the display
  }

  await syncWithFirestore(); // Sync immediately after removing a copy
}

async function updatePurchaseDate(gameId, instanceId, newDate) {
  const game = pokemonGames.find(g => g.id === gameId);
  if (game) {
    const copy = game.copies.find(c => c.instanceId === instanceId);
    if (copy) {
      copy.purchaseDate = newDate;
      saveUserOwnedGamesToLocalStorage();
      displayGames(); // Refresh the display
    }
  }

  await syncWithFirestore(); // Sync immediately after updating purchase date
}

function setupSyncEvents() {
  // Sync when leaving the page
  window.addEventListener('beforeunload', () => {
    syncWithFirestore();
  });

  // Sync on visibility change (tab switch or minimize)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      syncWithFirestore();
    }
  });

  // Periodic sync (optional, can be removed if not needed)
  setInterval(syncWithFirestore, SYNC_INTERVAL);
}

// Make sure these functions are available globally
window.toggleOwnedGame = toggleOwnedGame;
window.navigateToPokeBox = navigateToPokeBox;
window.removeCopy = removeCopy;
window.updatePurchaseDate = updatePurchaseDate;
window.syncGame = syncGame;

// Export syncWithFirestore for use in auth.js
export { syncWithFirestore };
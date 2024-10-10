let allGameData = null;

// Function to load the JSON data
export async function loadAllGameData() {
    if (allGameData === null) {
        try {
            const response = await fetch('./games/allgengames.json');
            allGameData = await response.json();
        } catch (error) {
            console.error('Error loading game data:', error);
            allGameData = { games: [] };
        }
    }
    return allGameData;
}

// Define the GameInstance structure
class GameInstance {
    constructor(gameId, condition = 'out-of-box', purchaseDate = new Date().toISOString().split('T')[0], notes = '', purchasePrice = 0) {
        this.instanceId = `${gameId}-${Date.now()}`;
        this.gameId = gameId;
        this.condition = condition;
        this.purchaseDate = purchaseDate;
        this.notes = notes;
        this.purchasePrice = purchasePrice;
        this.pokeboxData = [];
        // Additional fields will be added from the game data
    }
}

// Function to add a new game instance
export async function addGameInstance(gameId, condition, purchaseDate, notes, purchasePrice = 0) {
    await loadAllGameData();
    const gameInfo = allGameData.games.find(game => game.id === gameId);
    
    if (!gameInfo) {
        throw new Error(`Game with id ${gameId} not found`);
    }

    const newInstance = new GameInstance(gameId, condition, purchaseDate, notes, purchasePrice);
    
    // Add additional fields from the JSON data
    Object.assign(newInstance, {
        title: gameInfo.title,
        boxArtUrl: gameInfo.boxArtUrl,
        releaseDate: gameInfo.releaseDate,
        generation: gameInfo.generation,
        region: gameInfo.region,
        platforms: gameInfo.platforms,
        // Add any other fields you want from the game data
    });

    let userData = JSON.parse(localStorage.getItem('userData')) || { games: {} };
    
    if (!userData.games[gameId]) {
        userData.games[gameId] = [];
    }
    
    userData.games[gameId].push(newInstance);
    localStorage.setItem('userData', JSON.stringify(userData));
    
    return newInstance;
}


// Function to get all instances of a game
export function getGameInstances(gameId) {
    const userData = JSON.parse(localStorage.getItem('userData')) || { games: {} };
    return userData.games[gameId] || [];
}

// Function to update an instance
export function updateGameInstance(instanceId, updates) {
    let userData = JSON.parse(localStorage.getItem('userData')) || { games: {} };
    
    for (const gameId in userData.games) {
        const instanceIndex = userData.games[gameId].findIndex(instance => instance.instanceId === instanceId);
        if (instanceIndex !== -1) {
            userData.games[gameId][instanceIndex] = { ...userData.games[gameId][instanceIndex], ...updates };
            localStorage.setItem('userData', JSON.stringify(userData));
            return userData.games[gameId][instanceIndex];
        }
    }
    
    return null;
}

// Function to get all game data
export async function getAllGameData() {
    await loadAllGameData();
    return allGameData;
}
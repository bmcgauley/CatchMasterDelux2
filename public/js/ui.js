import { currentUser } from './auth.js';

export function updateUIForSignedInUser(user) {
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    const userDisplay = document.getElementById('userDisplay');

    if (signInButton) signInButton.style.display = 'none';
    if (signOutButton) signOutButton.style.display = 'block';
    if (userDisplay) userDisplay.textContent = `Welcome, ${user.displayName || user.email}!`;
}

export function updateUIForSignedOutUser() {
    const signInButton = document.getElementById('signInButton');
    const signOutButton = document.getElementById('signOutButton');
    const userDisplay = document.getElementById('userDisplay');

    if (signInButton) signInButton.style.display = 'block';
    if (signOutButton) signOutButton.style.display = 'none';
    if (userDisplay) userDisplay.textContent = '';
}

export function updateMainDisplay(page) {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    switch (page) {
        case 'games':
            mainContent.innerHTML = `
                <div class="container mx-auto py-8">
                    <h1 class="text-3xl font-bold mb-6">Games</h1>
                    <div id="games-container">
                        <ol id="games"></ol>
                    </div>
                </div>
            `;
            break;
        case 'pokedex':
            mainContent.innerHTML = `
                <div class="container mx-auto py-8">
                    <h1 class="text-3xl font-bold mb-6">Pokédex</h1>
                    <div id="pokedex-container"></div>
                </div>
            `;
            break;
        // Add more cases as needed
        default:
            console.log('Unknown page:', page);
    }
}

export function updateFilter(filter) {
    console.log(`Filtering with: ${filter}`);
    // Implement the actual filtering logic here
}

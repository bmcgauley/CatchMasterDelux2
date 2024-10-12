import { currentUser } from './auth.js';

export function updateUIForSignedInUser() {
    document.getElementById('signInButton').style.display = 'none';
    document.getElementById('signOutButton').style.display = 'block';
    document.getElementById('userDisplay').textContent = `Welcome, ${currentUser.displayName}!`;
}

export function updateUIForSignedOutUser() {
    document.getElementById('signInButton').style.display = 'block';
    document.getElementById('signOutButton').style.display = 'none';
    document.getElementById('userDisplay').textContent = '';
}

export function updateMainDisplay(page) {
    const mainContent = document.getElementById('main-content');
    switch (page) {
        case 'games':
            mainContent.innerHTML = `
                <div class="container">
                    <div id="main-container"></div>
                    <div id="games-container">
                        <ol id="games"></ol>
                    </div>
                </div>
            `;
            break;
        // ... (other cases)
    }
}

export function updateFilter(filter) {
    // Implement the filter functionality here
    console.log(`Filtering with: ${filter}`);
    // You can add the actual filtering logic based on your requirements
}

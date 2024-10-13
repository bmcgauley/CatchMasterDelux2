let myTeam = [];

export function addToTeam(pokemon) {
    if (myTeam.length < 6) {
        myTeam.push(pokemon);
        updateTeamDisplay();
    } else {
        alert("Your team is full! Remove a Pokémon before adding a new one.");
    }
}

export function removeFromTeam(index) {
    myTeam.splice(index, 1);
    updateTeamDisplay();
}

function updateTeamDisplay() {
    const teamContainer = document.getElementById('my-team');
    teamContainer.innerHTML = '';
    
    myTeam.forEach((pokemon, index) => {
        const pokemonEl = document.createElement('div');
        pokemonEl.classList.add('team-pokemon');
        pokemonEl.innerHTML = `
            <img src="${pokemon.sprites.front_default}" alt="${pokemon.name}">
            <p>${pokemon.name}</p>
            <button onclick="removeFromTeam(${index})">Remove</button>
        `;
        teamContainer.appendChild(pokemonEl);
    });
}

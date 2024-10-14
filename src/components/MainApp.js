import React from 'react';
import { Link } from 'react-router-dom';

export default function MainApp() {
  return (
    <div>
      <header>
        <nav>
          <ul>
            <li><Link to="/games">Games</Link></li>
            <li><Link to="/pokedex">Pokédex</Link></li>
            <li><Link to="/progress">Progress</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
          </ul>
        </nav>
      </header>
      <main>
        <h1>Welcome to Pokémon Tracker</h1>
        {/* Add more content for the main app here */}
      </main>
    </div>
  );
}

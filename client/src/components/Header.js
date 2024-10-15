import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "./ui/Button";

export default function Header() {
  const location = useLocation();

  const isHomePage = location.pathname === '/';
  const linkClass = "hover:text-yellow-300 transition-colors";

  return (
    <header className="bg-red-600 text-white shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="text-2xl font-bold">Pokémon Tracker</Link>
          <nav className="flex items-center">
            <ul className="flex space-x-4 mr-4">
              <li>
                {isHomePage ? (
                  <a href="#features" className={linkClass}>Features</a>
                ) : (
                  <Link to="/#features" className={linkClass}>Features</Link>
                )}
              </li>
              <li>
                {isHomePage ? (
                  <a href="#comparison" className={linkClass}>Comparison</a>
                ) : (
                  <Link to="/#comparison" className={linkClass}>Comparison</Link>
                )}
              </li>
              <li>
                {isHomePage ? (
                  <a href="#about" className={linkClass}>About</a>
                ) : (
                  <Link to="/#about" className={linkClass}>About</Link>
                )}
              </li>
              <li>
                {isHomePage ? (
                  <a href="#contact" className={linkClass}>Contact</a>
                ) : (
                  <Link to="/#contact" className={linkClass}>Contact</Link>
                )}
              </li>
            </ul>
            <Link to="/auth">
              <Button className="bg-yellow-400 text-gray-900 hover:bg-yellow-300">
                Login / Register
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

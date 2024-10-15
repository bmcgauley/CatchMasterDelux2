import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p>&copy; 2024 Pokémon Tracker. All rights reserved.</p>
          <nav className="mt-4 md:mt-0">
            <ul className="flex space-x-4">
              <li><a href="#" className="hover:text-yellow-300">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-yellow-300">Terms of Service</a></li>
              <li><a href="#" className="hover:text-yellow-300">Contact Us</a></li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}

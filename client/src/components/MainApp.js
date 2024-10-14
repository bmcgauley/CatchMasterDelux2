import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Input } from './ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';
import { Progress } from './ui/Progress';
import { ChevronLeft, ChevronRight, Search, User, LogOut } from 'lucide-react';

export default function MainApp() {
  const [activeTab, setActiveTab] = useState("games");
  const [selectedGame, setSelectedGame] = useState(null);
  const [showPokebox, setShowPokebox] = useState(false);

  const games = [
    { id: 1, title: "Pokémon Red", region: "Kanto", releaseDate: "1996-02-27", platform: "Game Boy", pokedexCount: 151, originalPrice: 29.99, image: "/placeholder.svg?height=150&width=150" },
    { id: 2, title: "Pokémon Green", region: "Kanto", releaseDate: "1996-02-27", platform: "Game Boy", pokedexCount: 151, originalPrice: 29.99, image: "/placeholder.svg?height=150&width=150" },
    { id: 3, title: "Pokémon Blue", region: "Kanto", releaseDate: "1996-10-15", platform: "Game Boy", pokedexCount: 151, originalPrice: 29.99, image: "/placeholder.svg?height=150&width=150" },
    { id: 4, title: "Pokémon Yellow", region: "Kanto", releaseDate: "1998-09-12", platform: "Game Boy", pokedexCount: 151, originalPrice: 29.99, image: "/placeholder.svg?height=150&width=150" },
  ];

  return (
    <div className="min-h-screen bg-[#f0f0f0] text-black">
      <header className="bg-red-600 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold">Pokémon Tracker</h1>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-white hover:bg-red-700">
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-red-700">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 rounded-lg bg-gray-900 bg-opacity-90 shadow-md">
            <TabsTrigger 
              value="games" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-yellow-400 text-gray-300 hover:text-yellow-200"
            >
              Games
            </TabsTrigger>
            <TabsTrigger 
              value="pokedex" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-yellow-400 text-gray-300 hover:text-yellow-200"
            >
              National Pokédex
            </TabsTrigger>
            <TabsTrigger 
              value="progress" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-yellow-400 text-gray-300 hover:text-yellow-200"
            >
              Progress
            </TabsTrigger>
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-yellow-400 text-gray-300 hover:text-yellow-200"
            >
              Dashboard
            </TabsTrigger>
          </TabsList>
          <TabsContent value="games" className="mt-4">
            <h2 className="mb-4 text-xl font-semibold">All Games</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {games.map((game) => (
                <Card key={game.id} className="bg-white shadow-md">
                  <CardContent className="p-4">
                    <img src={game.image} alt={game.title} className="mb-2 w-full" />
                    <h3 className="font-semibold">{game.title}</h3>
                    <p className="text-sm text-gray-600">Region: {game.region}</p>
                    <p className="text-sm text-gray-600">Release Date: {game.releaseDate}</p>
                    <p className="text-sm text-gray-600">Platform: {game.platform}</p>
                    <p className="text-sm text-gray-600">Pokédex Count: {game.pokedexCount}</p>
                    <p className="text-sm text-gray-600">Original Price: ${game.originalPrice}</p>
                    <div className="mt-2">
                      <h4 className="font-semibold">Owned Copies:</h4>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between rounded bg-gray-100 p-2 text-sm">
                          <span>Purchased: 2024-12-18</span>
                          <span>Paid: $100.00</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" className="bg-blue-500 text-white hover:bg-blue-600" onClick={() => {
                          setSelectedGame(game);
                          setShowPokebox(true);
                        }}>
                          Manage Pokébox
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
                          Remove Copy
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Input placeholder="Price paid" className="w-24 flex-grow" />
                      <Input type="date" className="w-32 flex-grow" />
                      <select className="rounded border p-1 flex-grow">
                        <option>New</option>
                        <option>Used</option>
                      </select>
                      <Button size="sm" className="bg-green-500 text-white hover:bg-green-600 flex-grow">Add Copy</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="pokedex" className="mt-4">
            {/* Add Pokedex content here */}
          </TabsContent>
          <TabsContent value="progress" className="mt-4">
            {/* Add Progress content here */}
          </TabsContent>
          <TabsContent value="dashboard" className="mt-4">
            <h2 className="mb-4 text-xl font-semibold">Welcome, Trainer!</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle>Overall Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={33} className="mb-2" />
                  <p className="text-sm text-gray-600">33% Complete across all games</p>
                </CardContent>
              </Card>
              <Card className="bg-white shadow-md">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-inside list-disc">
                    <li>Caught Pikachu in Pokémon Red</li>
                    <li>Completed Kanto Pokédex in Pokémon Blue</li>
                    <li>Added Pokémon Yellow to collection</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {showPokebox && selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-6xl bg-white">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-bold">{selectedGame.title} Pokébox</h2>
                <Button onClick={() => setShowPokebox(false)} className="bg-red-500 text-white hover:bg-red-600">Close</Button>
              </div>
              {/* Add Pokébox content here */}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
import React, { useState } from "react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Input } from "./ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/Table";
import { ChevronRight, CheckCircle, XCircle, Target, Users, Repeat, BarChart, Smartphone } from "lucide-react";

export default function EnhancedLandingPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Email submitted:", email);
    setEmail("");
  };

  const features = [
    {
      title: "Core Tracking Features",
      items: [
        "Living Dex Tracker",
        "Shiny Collection Tracker",
        "Game Completion Tracker",
        "Speedrun Tracker",
        "Competitive Team Builder"
      ],
      icon: Target
    },
    {
      title: "Community Features",
      items: [
        "User Profiles",
        "Forums and Discussion Boards",
        "Achievements and Badges",
        "Rankings and Leaderboards",
        "News and Updates"
      ],
      icon: Users
    },
    {
      title: "Trading and Exchange",
      items: [
        "Local Trading Matchmaking",
        "Online Trading Platform",
        "Giveaway and Contest Platform"
      ],
      icon: Repeat
    },
    {
      title: "Data and Analytics",
      items: [
        "Advanced Search and Filtering",
        "Data Visualization Tools",
        "Personal Analytics Dashboard",
        "Global Statistics"
      ],
      icon: BarChart
    },
    {
      title: "Integration and Connectivity",
      items: [
        "Mobile Companion App",
        "API for Developers",
        "Import/Export Tools"
      ],
      icon: Smartphone
    }
  ];

  const competitors = [
    {
      name: "Pokédex Tracker",
      features: {
        "Comprehensive Tracking": false,
        "Integrated Community": false,
        "Cross-Game Compatibility": true,
        "Data Visualization": false,
        "Mobile-Responsive": true,
        "Customization": false
      }
    },
    {
      name: "Pokémon HOME",
      features: {
        "Comprehensive Tracking": false,
        "Integrated Community": false,
        "Cross-Game Compatibility": true,
        "Data Visualization": false,
        "Mobile-Responsive": true,
        "Customization": false
      }
    },
    {
      name: "Bulbapedia",
      features: {
        "Comprehensive Tracking": false,
        "Integrated Community": true,
        "Cross-Game Compatibility": true,
        "Data Visualization": false,
        "Mobile-Responsive": true,
        "Customization": false
      }
    },
    {
      name: "Our Platform",
      features: {
        "Comprehensive Tracking": true,
        "Integrated Community": true,
        "Cross-Game Compatibility": true,
        "Data Visualization": true,
        "Mobile-Responsive": true,
        "Customization": true
      }
    }
  ];

  return (
    <div className="min-h-screen bg-[#f0f0f0] text-gray-900">
      <header className="bg-red-600 text-white shadow-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold">Pokémon Tracker</h1>
            <nav>
              <ul className="flex space-x-4">
                <li><a href="#features" className="hover:text-yellow-300 transition-colors">Features</a></li>
                <li><a href="#comparison" className="hover:text-yellow-300 transition-colors">Comparison</a></li>
                <li><a href="#about" className="hover:text-yellow-300 transition-colors">About</a></li>
                <li><a href="#contact" className="hover:text-yellow-300 transition-colors">Contact</a></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <section className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Track Your Pokémon Journey Like Never Before</h2>
          <p className="text-xl mb-8 text-gray-700">Manage your game collection, organize Pokémon boxes, and track your Pokédex completion across all generations!</p>
          <Button className="bg-red-600 text-white hover:bg-red-700 text-lg px-8 py-3">
            Get Started <ChevronRight className="inline-block ml-2" />
          </Button>
        </section>

        <section id="features" className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center text-gray-900">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((category, index) => (
              <Card key={index} className="border-2 border-yellow-400 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="bg-gray-900 text-yellow-300">
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="w-6 h-6" />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="bg-white">
                  <ul className="space-y-2">
                    {category.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="comparison" className="mb-16">
          <h3 className="text-3xl font-bold mb-8 text-center text-gray-900">How We Compare</h3>
          <Card className="border-2 border-yellow-400 shadow-lg">
            <CardHeader className="bg-gray-900 text-yellow-300">
              <CardTitle className="text-2xl">Competitive Analysis</CardTitle>
            </CardHeader>
            <CardContent className="bg-gradient-to-br from-gray-100 to-yellow-100 p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-200">
                    <TableHead className="text-gray-900">Feature</TableHead>
                    {competitors.map((competitor, index) => (
                      <TableHead key={index} className="text-gray-900">{competitor.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(competitors[0].features).map((feature, index) => (
                    <TableRow key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <TableCell className="font-medium text-gray-900">{feature}</TableCell>
                      {competitors.map((competitor, compIndex) => (
                        <TableCell key={compIndex}>
                          {competitor.features[feature] ? (
                            <CheckCircle className="text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="text-red-500 mx-auto" />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <section id="about" className="mb-16">
          <Card className="bg-gray-900 text-white border-2 border-yellow-400">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 text-yellow-300">About Pokémon Tracker</h3>
              <p className="mb-4">
                Pokémon Tracker is the ultimate companion for trainers who want to keep their Pokémon journey organized. 
                Whether you're a casual player or a hardcore collector, our app helps you manage your games, Pokémon, and progress all in one place.
              </p>
              <p>
                Built by trainers, for trainers, Pokémon Tracker is designed to enhance your Pokémon experience across all generations and games.
              </p>
            </CardContent>
          </Card>
        </section>

        <section id="contact" className="text-center mb-16">
          <h3 className="text-2xl font-bold mb-4 text-gray-900">Stay Updated</h3>
          <p className="mb-4 text-gray-700">Sign up for our newsletter to get the latest updates and be notified when we launch!</p>
          <form onSubmit={handleSubmit} className="flex max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-grow mr-2"
              required
            />
            <Button type="submit" className="bg-red-600 text-white hover:bg-red-700">
              Subscribe
            </Button>
          </form>
        </section>
      </main>

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
    </div>
  );
}

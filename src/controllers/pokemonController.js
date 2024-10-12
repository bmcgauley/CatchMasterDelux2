const axios = require('axios');

exports.getAllPokemon = async (req, res) => {
  try {
    const response = await axios.get('https://pokeapi.co/api/v2/pokemon?limit=151');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Pokemon:', error);
    res.status(500).json({ error: 'Error fetching Pokemon' });
  }
};

exports.getPokemonById = async (req, res) => {
  const id = req.params.id;
  try {
    const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching Pokemon with id ${id}:`, error);
    res.status(500).json({ error: `Error fetching Pokemon with id ${id}` });
  }
};

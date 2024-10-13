export async function fetchPokemon(id) {
  try {
    const url = id ? `/api/pokemon/${id}` : '/api/pokemon';
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Pokemon:', error);
    throw error;
  }
}

export async function fetchAllPokemon() {
  return fetchPokemon();
}

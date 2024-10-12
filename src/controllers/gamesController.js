exports.getGames = (req, res) => {
  res.render('games', { title: 'CatchMaster Delux - Games' });
};

exports.getPokedex = (req, res) => {
  res.render('pokedex', { title: 'CatchMaster Delux - Pokédex' });
};

exports.getPokebox = (req, res) => {
  res.render('pokebox', { title: 'CatchMaster Delux - Pokébox' });
};

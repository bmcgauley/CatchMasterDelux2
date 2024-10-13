exports.getGames = (req, res) => {
  res.render('games', { title: 'CatchMaster Delux - Games' });
};

exports.getPokedex = (req, res) => {
  res.render('pokedex', { title: 'CatchMaster Delux - Pokédex' });
};

exports.getPokebox = (req, res) => {
  res.render('pokebox', { title: 'CatchMaster Delux - Pokébox' });
};

exports.getHome = (req, res) => {
  res.render('index', { title: 'CatchMaster Delux - Your Ultimate Pokémon Tracking Experience' });
};

exports.getMyTeam = (req, res) => {
  res.render('myteam', { title: 'CatchMaster Delux - My Team' });
};

const express = require('express');
const router = express.Router();
const gamesController = require('../controllers/gamesController');

router.get('/', gamesController.getHome);
router.get('/games', gamesController.getGames);
router.get('/pokedex', gamesController.getPokedex);
router.get('/pokebox', gamesController.getPokebox);
router.get('/myteam', gamesController.getMyTeam);

module.exports = router;

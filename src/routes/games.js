const express = require('express');
const router = express.Router();
const gamesController = require('../controllers/gamesController');

router.get('/', gamesController.getGames);
router.get('/pokedex', gamesController.getPokedex);
router.get('/pokebox', gamesController.getPokebox);

module.exports = router;

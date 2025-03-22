const express = require('express');
const router = express.Router();
const filmController = require('../controllers/filmController');

// GET all movies
router.get('/', filmController.getAllFilms);

// GET movie by ID
router.get('/:id', filmController.getFilmById);

// POST create new movie
router.post('/', filmController.createFilm);

// PUT update movie by ID
router.put('/:id', filmController.updateFilm);

// DELETE movie by ID
router.delete('/:id', filmController.deleteFilm);


// GET movie by Title
router.get('/title/:title', filmController.searchFilmsByTitle);

// GET movie by Actor
router.get('/actor/:lastName', filmController.searchFilmsByActor);

// GET movie by Language
router.get('/language/:language', filmController.searchFilmsByLanguage);

// GET movie by Category
router.get('/category/:category', filmController.searchFilmsByCategory);

// GET movie Actors by Title
router.get('/title/:title/actors', filmController.getFilmActorsByTitle);

module.exports = router;

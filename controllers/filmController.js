// controllers/filmController.js

const db = require('../config/database');
const initModels = require("../models/init-models");
const models = initModels(db);

// Kuvab kõike filme
// GET api/films
// GET api/films?page=2&pageSize=5

exports.getAllFilms = async (req, res) => {
    try {
        // võtab lehe ja lehe suuruse päringu parameetritest (vaikimisi 1. leht ja 10 filmi lehe kohta)
        const { page = 1, pageSize = 10 } = req.query;
        const limit = parseInt(pageSize, 10); // teisendab need arvudeks
        const offset = (parseInt(page, 10) - 1) * limit;
        // otsib andmebaasist filmid koos koguarvuga (pagineeritult)
        const { count, rows: films } = await models.film.findAndCountAll({
            limit,
            offset,
        });
        res.status(200).json({ // saadab filmid koos leheinfo ja koguarvuga tagasi
            totalFilms: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page, 10),
            films,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching movies' });
    }
};


// Filmi kohta info saamine selle identifikaatori järgi. 
// GET api/films/50

exports.getFilmById = async (req, res) => {
    // võtab filmi id url-i parameetritest
    const { id } = req.params;
    try {
        // otsib filmi esmase võtme (id) alusel
        const film = await models.film.findByPk(id);
        // kui filmi ei leita
        if (!film) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        // kui film on leitud
        res.status(200).json(film);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while fetching movie information' });
    }
};

// Uue filmi loomine koos pealkirja, ilmumisaasta, žanri, režissööri ja keelega.
// POST api/films

/* {
    "title": "UNBREAKABLE",
    "release_year": 1995,
    "genre": "Thriller",
    "director": "Manoj Nelliyattu",
    "languageName": "English"
} */

exports.createFilm = async (req, res) => {
    // võtab filmi andmed päringu kehast
    const { title, release_year, genre, director, languageName } = req.body;

    try {
        // teeb keele nime normaalseks (nt "english" → "English")
        const normalizedLanguageName = languageName.charAt(0).toUpperCase() + languageName.slice(1).toLowerCase();
        // otsib olemasoleva keele
        const foundLanguage = await models.language.findOne({
            where: { name: normalizedLanguageName }
        });
        if (!foundLanguage) { // kui keelt ei leita
            return res.status(404).json({ message: 'Language not found. Try English, Italian, Japanese, Mandarin, French or German'
        });
        } // loob uue filmi
        const film = await models.film.create({
            title,
            release_year,
            genre,
            director,
            language_id: foundLanguage.language_id
        });
        res.status(201).json(film); // tagastab loodud filmi andmed
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while creating movie' });
    }
};
    

// Filmiinfo uuendamine.
// PUT api/films/1012

/* {
    "title": "UNBREAKABLE",
    "release_year": 2000,
    "genre": "Thriller",
    "director": "Manoj Nelliyattu",
    "languageName": "English"
} */

exports.updateFilm = async (req, res) => {
    const { id } = req.params; // võtab filmi id url-i parameetritest
    // võtab uuendatavad andmed päringu kehast
    const { title, release_year, genre, director, language_id } = req.body;
    try {
        // otsib filmi id alusel andmebaasist
        const film = await models.film.findByPk(id);
        if (!film) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        // uuendab filmi andmed
        await film.update({ title, release_year, genre, director, language_id });
        res.status(200).json(film); // tagastab uuendatud filmi andmed
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while updating movie information' });
    }
};
    

// Filmi kustutamine andmebaasist. 
// DELETE api/films/1010

exports.deleteFilm = async (req, res) => {
    const { id } = req.params; // võtab filmi id url-i parameetritest
    try {
        // otsib filmi id alusel andmebaasist
        const film = await models.film.findByPk(id);
        if (!film) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        await film.destroy(); // kustutab filmi andmebaasist
        res.status(200).json({ message: 'Film on kustutatud andmebaasist' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while deleting the movie' });
    }
};


// Info vaatamine ja otsimine: 

// Filmi otsing pealkirja järgi
// api/films/title/beast%20hunchback

exports.searchFilmsByTitle = async (req, res) => {
    const { title } = req.params;

    try {
        // muudab pealkirja suurteks tähtedeks, nagu andmebaasis
        const searchTitle = title.toUpperCase();
        // otsib andmebaasist filmi
        const films = await models.film.findAll({ where: { title: searchTitle } });
        if (!films?.length) {
            return res.status(404).json({ message: 'No movies found with the given title' });
        }
        res.status(200).json(films[0]); // tagastab leitud filmi
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while searching movies by title' });
    }
};



// Filmi otsing näitleja järgi 
// api/films/actor/davis

exports.searchFilmsByActor = async (req, res) => {
    const { lastName } = req.params;

    try {
        // muudab perekonnanime suurteks tähtedeks, nagu andmebaasis
        const searchLastName = lastName.toUpperCase();
        // otsib andmebaasist näitlejad, kelle perekonnanimi vastab sellele
        // ja toob kaasa filmid, milles nad on osalenud
        const actors = await models.actor.findAll({
            where: { last_name: searchLastName },
            include: [{ model: models.film, as: 'film_id_films', through: { attributes: [] } }]
        });
        if (!actors?.length) {
            return res.status(404).json({ message: 'Actor not found or no movies found' });
        }
        // koostab vastuseks objekti iga näitleja kohta koos tema filmidega
        const result = actors.map(actor => ({
            actor_id: actor.actor_id,
            first_name: actor.first_name,
            last_name: actor.last_name,
            filmCount: actor.film_id_films.length,
            films: actor.film_id_films
        }));
        res.status(200).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while searching movies by actor' });
    }
};




// Filmi otsing keele järgi.
// api/films/language/english

exports.searchFilmsByLanguage = async (req, res) => {
    const { language } = req.params;

    try {
        // teeb sisestatud keele esimese tähe suureks ja ülejäänud väikeseks
        const normalizedLanguage = language.charAt(0).toUpperCase() + language.slice(1).toLowerCase();
        // otsib kõik filmid, mis on seotud selle keelega
        const films = await models.film.findAll({
            include: [{
                model: models.language,
                as: "language",
                where: { name: normalizedLanguage }
            }]
        });
        if (!films?.length) {
            return res.status(404).json({ message: 'Language not found or no movies found' });
        }
        // kui filmid leitud, saadan need koos küsitud keelega ja koguarvuga tagasi
        res.status(200).json({ requestedLanguage: language, filmCount: films.length, films });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while searching movies by language' });
    }
};

// Filmi otsing kategooria järgi. 
/* api/films/category/comedy
   api/films/category/comedy */

exports.searchFilmsByCategory = async (req, res) => {
    const { category } = req.params;
    try {
        // teeb kategooria formaati vastavaks (nt sci-fi -> Sci-Fi)
        const normalizedCategory = normalizeCategory(category);
        // otsib kõik filmid, mis kuuluvad antud kategooriasse
        const films = await models.film.findAll({
            include: [{
                model: models.category,
                as: "category_id_categories",
                where: { name: normalizedCategory }
            }]
        });
        if (!films?.length) {
            return res.status(404).json({ message: 'Category not found or no movies found' });
        }
        // tagastab tulemused
        res.status(200).json({ requestedCategory: category, filmCount: films.length, films });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while searching movies by category' });
    }
};
// abifunktsioon kategooria vormindamiseks
const normalizeCategory = (str) => {
    return str
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('-');
};

// Filmis osalenud näitlejate nimekirja saamine. 
// api/films/title/airplane%20sierra/actors

exports.getFilmActorsByTitle = async (req, res) => {
    const { title } = req.params;
    try {
        // muudab pealkirja suurteks tähtedeks, et see vastaks andmebaasi formaadile
        const searchTitle = title.toUpperCase();
        // otsib andmebaasist filmi koos seotud näitlejatega
        const film = await models.film.findOne({
            where: { title: searchTitle },
            include: [{
                model: models.actor,
                as: 'actor_id_actors',
                through: { attributes: [] } // ei too vahetabeli andmeid kaasa
            }]
        });
        if (!film) {
            return res.status(404).json({ message: 'Movie not found' });
        }
        // kui leitud, saadab selle info koos seotud näitlejatega tagasi
        res.status(200).json({
            film_id: film.film_id,
            title: film.title,
            actorCount: film.actor_id_actors.length,
            actors: film.actor_id_actors
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'An error occurred while searching actors by movie' });
    }
};

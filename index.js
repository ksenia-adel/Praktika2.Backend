const express = require('express');
const app = express();
const categoryRoutes = require('./routes/categoryRoutes');
const filmRoutes = require('./routes/filmRoutes');

// Middleware for parsing JSON
app.use(express.json());

// Connect category routes
app.use('/api/categories', categoryRoutes);
app.use('/api/films', filmRoutes);

// The port on which the server will run
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


app.get('/', function (req, res) {
    res.send('MOVIES')
})


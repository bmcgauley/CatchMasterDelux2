const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
const gamesRouter = require('./routes/games');
const apiRouter = require('./routes/api');

app.use('/', gamesRouter);
app.use('/api', apiRouter);

// Example route
app.get('/', (req, res) => {
  res.render('index', { title: 'CatchMaster Delux' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

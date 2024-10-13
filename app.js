const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Add body-parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const gamesRouter = require('./routes/games');
const apiRouter = require('./routes/api');

app.use('/', gamesRouter);
app.use('/api', apiRouter);

// Update the landing page route
app.get('/', (req, res) => {
  res.render('index', { 
    title: 'Welcome to CatchMaster Delux',
    subscribed: req.query.subscribed === 'true'
  });
});

// Remove or comment out the '/home' route since we're using index.ejs as the homepage
// app.get('/home', (req, res) => {
//   res.render('home', { 
//     title: 'Home | CatchMaster Delux',
//     subscribed: req.query.subscribed === 'true'
//   });
// });

// Newsletter subscription route
app.post('/subscribe', (req, res) => {
  const email = req.body.email;
  // TODO: Implement actual newsletter subscription logic
  console.log(`Subscribed email: ${email}`);
  res.redirect('/?subscribed=true');
});

// Serve allgengames.json file
app.get('/games/allgengames.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'games', 'allgengames.json'));
});

// Add this line to serve static files from the 'assets' directory
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

// Add these routes
app.get('/myteam', (req, res) => {
  res.render('myteam', { title: 'My Team | CatchMaster Delux' });
});

app.get('/pokebox', (req, res) => {
  res.render('pokebox', { title: 'Pokébox | CatchMaster Delux' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const express = require('express');
const path = require('path');
require('dotenv').config(); // Load environment variables

const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// API routes
const uploadRouter = require('./backend/api/upload');
app.use('/api/upload', uploadRouter);

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'client/build')));

// For any request that doesn't match one above, send back the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Upload API available at http://localhost:${PORT}/api/upload`);
});

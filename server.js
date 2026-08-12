const express = require('express');
const path = require('path');

const app = express();
// Render assigns a port dynamically via the PORT environment variable
const PORT = process.env.PORT || 3000;

// Tell Express to serve any static files (HTML, CSS, JS, images) from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Start the server
app.listen(PORT, () => {
    console.log(`Listing Tools web service is running on port ${PORT}`);
});
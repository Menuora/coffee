const express = require('express');
const path = require('path');
const app = express();

// Serve all static files from root directory
app.use(express.static(path.join(__dirname, '..')));

// Admin route fallback to serve admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

module.exports = app;

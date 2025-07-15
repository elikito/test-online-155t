const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('¡Hola Mundo desde Vercel con Node.js!');
});

module.exports = app;

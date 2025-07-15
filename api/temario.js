const fs = require('fs');
const path = require('path');
const marked = require('marked');

module.exports = (req, res) => {
  const filePath = path.join(__dirname, '..', 'assets', 'temario.dm');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) return res.status(500).send('No se pudo leer el temario');
    const html = marked.parse(data);
    res.send(html);
  });
};

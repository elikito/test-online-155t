const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  const examsDir = path.join(__dirname, '..', 'exams');
  fs.readdir(examsDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Error leyendo los exámenes' });
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    res.json(jsonFiles);
  });
};

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const examsDir = path.join(process.cwd(), 'public', 'exams');
  let allQuestions = [];

  try {
    const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json'));
    files.forEach(file => {
      const filePath = path.join(examsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      let questions = [];
      try {
        questions = JSON.parse(content);
      } catch (e) {
        console.warn(`Error parsing ${file}:`, e);
        return;
      }
      if (!Array.isArray(questions)) return;
      questions = questions.map(q => ({
        ...q,
        examen: q.examen || file.replace(/\.json$/, '')
      }));
      allQuestions = allQuestions.concat(questions);
    });
    res.status(200).json(allQuestions);
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron cargar las preguntas.' });
  }
}
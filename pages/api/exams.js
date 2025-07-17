import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const dir = path.join(process.cwd(), 'public', 'exams');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  res.status(200).json(files);
}
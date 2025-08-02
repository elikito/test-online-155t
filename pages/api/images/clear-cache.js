import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const adminToken = req.headers.authorization?.replace('Bearer ', '');
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  try {
    const cacheFile = path.join(process.cwd(), '.images-cache.json');
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'questions');

    // Eliminar caché
    if (fs.existsSync(cacheFile)) {
      fs.unlinkSync(cacheFile);
    }

    // Eliminar imágenes descargadas
    if (fs.existsSync(imagesDir)) {
      const files = fs.readdirSync(imagesDir);
      files.forEach(file => {
        const filePath = path.join(imagesDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
    }

    res.status(200).json({ success: true, message: 'Caché e imágenes eliminadas' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Error eliminando caché' });
  }
}
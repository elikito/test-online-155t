import { processImages } from '../../../scripts/download-images.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const adminToken = req.headers.authorization?.replace('Bearer ', '');
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  try {
    await processImages();
    res.status(200).json({ success: true, message: 'Imágenes procesadas correctamente' });
  } catch (error) {
    console.error('Error downloading images:', error);
    res.status(500).json({ error: 'Error descargando imágenes' });
  }
}
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const adminToken = req.headers.authorization?.replace('Bearer ', '');
  if (adminToken !== process.env.ADMIN_TOKEN) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  try {
    const examsDir = path.join(process.cwd(), 'public', 'exams');
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'questions');
    const cacheFile = path.join(process.cwd(), '.images-cache.json');

    // Contar preguntas total y con imágenes
    let totalQuestions = 0;
    let questionsWithImages = 0;
    let uniqueImages = new Set();

    const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json'));
    
    files.forEach(file => {
      const filePath = path.join(examsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      try {
        const data = JSON.parse(content);
        
        // Verificar si tiene la estructura correcta
        if (data.questions && Array.isArray(data.questions)) {
          data.questions.forEach(question => {
            totalQuestions++;
            let hasImages = false;
            
            // Imagen de pregunta - verificar múltiples formatos
            if (question.image) {
              if (typeof question.image === 'string' && question.image.trim()) {
                uniqueImages.add(question.image);
                hasImages = true;
              } else if (question.image.name && question.image.name.trim()) {
                uniqueImages.add(question.image.name);
                hasImages = true;
              } else if (question.image.url && question.image.url.trim()) {
                // Extraer nombre del archivo de la URL
                const urlParts = question.image.url.split('/');
                const fileName = urlParts[urlParts.length - 1];
                if (fileName && fileName.includes('.')) {
                  uniqueImages.add(fileName);
                  hasImages = true;
                }
              }
            }
            
            // Imágenes de respuestas
            if (question.answers && Array.isArray(question.answers)) {
              question.answers.forEach(answer => {
                if (answer.image) {
                  if (typeof answer.image === 'string' && answer.image.trim()) {
                    uniqueImages.add(answer.image);
                    hasImages = true;
                  } else if (answer.image.name && answer.image.name.trim()) {
                    uniqueImages.add(answer.image.name);
                    hasImages = true;
                  } else if (answer.image.url && answer.image.url.trim()) {
                    // Extraer nombre del archivo de la URL
                    const urlParts = answer.image.url.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    if (fileName && fileName.includes('.')) {
                      uniqueImages.add(fileName);
                      hasImages = true;
                    }
                  }
                }
              });
            }
            
            if (hasImages) questionsWithImages++;
          });
        }
        // Si no tiene la estructura esperada, contar como un array plano
        else if (Array.isArray(data)) {
          data.forEach(question => {
            totalQuestions++;
            let hasImages = false;
            
            // Imagen de pregunta
            if (question.image) {
              if (typeof question.image === 'string' && question.image.trim()) {
                uniqueImages.add(question.image);
                hasImages = true;
              } else if (question.image.name && question.image.name.trim()) {
                uniqueImages.add(question.image.name);
                hasImages = true;
              } else if (question.image.url && question.image.url.trim()) {
                const urlParts = question.image.url.split('/');
                const fileName = urlParts[urlParts.length - 1];
                if (fileName && fileName.includes('.')) {
                  uniqueImages.add(fileName);
                  hasImages = true;
                }
              }
            }
            
            // Imágenes de respuestas
            if (question.answers && Array.isArray(question.answers)) {
              question.answers.forEach(answer => {
                if (answer.image) {
                  if (typeof answer.image === 'string' && answer.image.trim()) {
                    uniqueImages.add(answer.image);
                    hasImages = true;
                  } else if (answer.image.name && answer.image.name.trim()) {
                    uniqueImages.add(answer.image.name);
                    hasImages = true;
                  } else if (answer.image.url && answer.image.url.trim()) {
                    const urlParts = answer.image.url.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    if (fileName && fileName.includes('.')) {
                      uniqueImages.add(fileName);
                      hasImages = true;
                    }
                  }
                }
              });
            }
            
            if (hasImages) questionsWithImages++;
          });
        }
      } catch (e) {
        console.warn(`Error parsing ${file}:`, e.message);
      }
    });

    // Contar imágenes descargadas - buscar en todos los subdirectorios
    let downloadedImages = 0;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    
    function countImagesInDir(dir) {
      let count = 0;
      if (fs.existsSync(dir)) {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const itemPath = path.join(dir, item);
          const stat = fs.statSync(itemPath);
          
          if (stat.isDirectory()) {
            count += countImagesInDir(itemPath);
          } else if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (imageExtensions.includes(ext)) {
              count++;
            }
          }
        });
      }
      return count;
    }

    downloadedImages = countImagesInDir(imagesDir);

    // Leer caché si existe
    let cacheInfo = null;
    if (fs.existsSync(cacheFile)) {
      try {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        const totalSize = Object.values(cache).reduce((sum, img) => sum + (img.size || 0), 0);
        cacheInfo = {
          count: Object.keys(cache).length,
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
        };
      } catch (e) {
        cacheInfo = null;
      }
    }

    // Log para debugging
    console.log('Status debug:', {
      totalQuestions,
      questionsWithImages,
      uniqueImagesCount: uniqueImages.size,
      downloadedImages,
      uniqueImagesList: Array.from(uniqueImages).slice(0, 5), // Primeras 5 para debug
      files: files.length
    });

    res.status(200).json({
      questions: {
        total: totalQuestions,
        withImages: questionsWithImages
      },
      images: {
        total: uniqueImages.size,
        downloaded: downloadedImages,
        missing: Math.max(0, uniqueImages.size - downloadedImages)
      },
      cache: cacheInfo,
      debug: {
        filesProcessed: files.length,
        sampleImages: Array.from(uniqueImages).slice(0, 3)
      }
    });

  } catch (error) {
    console.error('Error getting images status:', error);
    res.status(500).json({ error: 'Error obteniendo estado de imágenes' });
  }
}
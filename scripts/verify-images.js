import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cacheFile = path.join(__dirname, '..', '.images-cache.json');

function verifyImages() {
    if (!fs.existsSync(cacheFile)) {
        console.log('📋 No hay caché de imágenes');
        return;
    }
    
    const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
    const imageCount = Object.keys(cache).length;
    
    console.log(`📊 Total de imágenes en caché: ${imageCount}`);
    
    // Mostrar algunas estadísticas
    const totalSize = Object.values(cache).reduce((sum, img) => sum + (img.size || 0), 0);
    console.log(`💾 Espacio total usado: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    // Verificar integridad
    let missingFiles = 0;
    const imagesDir = path.join(__dirname, '..', 'public', 'images', 'questions');
    
    Object.keys(cache).forEach(imageName => {
        const imagePath = path.join(imagesDir, imageName);
        if (!fs.existsSync(imagePath)) {
            missingFiles++;
            console.log(`❌ Archivo faltante: ${imageName}`);
        }
    });
    
    if (missingFiles === 0) {
        console.log('✅ Todas las imágenes del caché están presentes');
    } else {
        console.log(`⚠️  ${missingFiles} archivos faltantes`);
    }
}

verifyImages();
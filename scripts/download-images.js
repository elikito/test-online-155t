import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios
const imagesDir = path.join(__dirname, '..', 'public', 'images', 'questions');
const cacheFile = path.join(__dirname, '..', '.images-cache.json');

// Crear directorio para imágenes si no existe
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Cargar caché de imágenes descargadas
function loadImageCache() {
    if (fs.existsSync(cacheFile)) {
        try {
            return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        } catch (error) {
            console.warn('⚠️  Error leyendo caché de imágenes, creando nuevo...');
        }
    }
    return {};
}

// Guardar caché de imágenes
function saveImageCache(cache) {
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
}

// Función para descargar imagen con manejo de redirecciones
function downloadImage(url, filepath, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        if (maxRedirects <= 0) {
            reject(new Error('Demasiadas redirecciones'));
            return;
        }

        const protocol = url.startsWith('https:') ? https : http;
        const file = fs.createWriteStream(filepath);
        
        protocol.get(url, (response) => {
            // Manejar redirecciones
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlink(filepath, () => {});
                
                if (response.headers.location) {
                    console.log(`🔄 Redirigiendo: ${response.statusCode} -> ${response.headers.location}`);
                    downloadImage(response.headers.location, filepath, maxRedirects - 1)
                        .then(resolve)
                        .catch(reject);
                } else {
                    reject(new Error(`Redirección sin location header: ${response.statusCode}`));
                }
                return;
            }
            
            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(filepath, () => {});
                reject(new Error(`HTTP ${response.statusCode}: ${url}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                resolve(filepath);
            });
            
            file.on('error', (err) => {
                fs.unlink(filepath, () => {});
                reject(err);
            });
        }).on('error', (err) => {
            file.close();
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// Función principal para procesar imágenes
async function processImages() {
    console.log('🖼️  Verificando imágenes...');
    
    const examsDir = path.join(__dirname, '..', 'public', 'exams');
    const imageCache = loadImageCache();
    
    let totalImages = 0;
    let downloadedImages = 0;
    let skippedImages = 0;
    let failedImages = 0;

    try {
        const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json'));
        
        for (const file of files) {
            const filePath = path.join(examsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            
            try {
                const data = JSON.parse(content);
                
                // Solo procesar formato OpositaTest
                if (!data.questions || !Array.isArray(data.questions)) {
                    continue;
                }
                
                console.log(`📄 Procesando: ${file}`);
                
                for (const question of data.questions) {
                    // Procesar imagen de la pregunta
                    if (question.image && question.image.thumbs && question.image.name) {
                        totalImages++;
                        const imageName = question.image.name;
                        const localPath = path.join(imagesDir, imageName);
                        
                        // Verificar si ya está en caché y existe el archivo
                        if (imageCache[imageName] && fs.existsSync(localPath)) {
                            skippedImages++;
                            continue;
                        }
                        
                        try {
                            console.log(`📥 Descargando: ${imageName}`);
                            await downloadImage(question.image.thumbs.original, localPath);
                            imageCache[imageName] = {
                                downloaded: new Date().toISOString(),
                                originalUrl: question.image.thumbs.original,
                                size: fs.statSync(localPath).size
                            };
                            downloadedImages++;
                            console.log(`✅ Descargada: ${imageName} (${(fs.statSync(localPath).size / 1024).toFixed(1)} KB)`);
                        } catch (error) {
                            failedImages++;
                            console.error(`❌ Error descargando ${imageName}:`, error.message);
                        }
                        
                        // Pequeña pausa para no sobrecargar el servidor
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                    
                    // Procesar imágenes de las respuestas
                    if (question.answers && Array.isArray(question.answers)) {
                        for (const answer of question.answers) {
                            if (answer.image && answer.image.thumbs && answer.image.name) {
                                totalImages++;
                                const imageName = answer.image.name;
                                const localPath = path.join(imagesDir, imageName);
                                
                                if (imageCache[imageName] && fs.existsSync(localPath)) {
                                    skippedImages++;
                                    continue;
                                }
                                
                                try {
                                    console.log(`📥 Descargando: ${imageName}`);
                                    await downloadImage(answer.image.thumbs.original, localPath);
                                    imageCache[imageName] = {
                                        downloaded: new Date().toISOString(),
                                        originalUrl: answer.image.thumbs.original,
                                        size: fs.statSync(localPath).size
                                    };
                                    downloadedImages++;
                                    console.log(`✅ Descargada: ${imageName} (${(fs.statSync(localPath).size / 1024).toFixed(1)} KB)`);
                                } catch (error) {
                                    failedImages++;
                                    console.error(`❌ Error descargando ${imageName}:`, error.message);
                                }
                                
                                await new Promise(resolve => setTimeout(resolve, 200));
                            }
                        }
                    }
                }
                
            } catch (error) {
                console.warn(`⚠️  Error procesando ${file}:`, error.message);
            }
        }
        
        // Guardar caché actualizado
        saveImageCache(imageCache);
        
        console.log('\n📊 Resumen:');
        console.log(`   - ${downloadedImages} imágenes descargadas`);
        console.log(`   - ${skippedImages} ya existían`);
        console.log(`   - ${failedImages} fallaron`);
        console.log(`   - ${totalImages} total encontradas`);
        
        if (downloadedImages > 0) {
            const totalCacheSize = Object.values(imageCache).reduce((sum, img) => sum + (img.size || 0), 0);
            console.log(`💾 Espacio total usado: ${(totalCacheSize / 1024 / 1024).toFixed(2)} MB`);
        }
        
    } catch (error) {
        console.error('❌ Error procesando imágenes:', error.message);
    }
}

// Ejecutar si se llama directamente o exportar para uso en API
if (typeof require !== 'undefined' && require.main === module) {
    // Ejecutado directamente desde terminal
    processImages();
}

export { processImages };
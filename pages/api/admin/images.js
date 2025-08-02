import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const imagesDir = path.join(process.cwd(), 'public', 'images', 'questions');
const cacheFile = path.join(process.cwd(), '.images-cache.json');

// Crear directorio si no existe
if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
}

function loadImageCache() {
    if (fs.existsSync(cacheFile)) {
        try {
            return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        } catch (error) {
            return {};
        }
    }
    return {};
}

function saveImageCache(cache) {
    fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
}

function downloadImage(url, filepath, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
        if (maxRedirects <= 0) {
            reject(new Error('Demasiadas redirecciones'));
            return;
        }

        const protocol = url.startsWith('https:') ? https : http;
        const file = fs.createWriteStream(filepath);
        
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                file.close();
                fs.unlink(filepath, () => {});
                
                if (response.headers.location) {
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

export default async function handler(req, res) {
    // Verificar que sea admin
    const adminToken = req.headers.authorization?.replace('Bearer ', '');
    if (adminToken !== process.env.ADMIN_TOKEN) {
        return res.status(403).json({ error: 'No autorizado' });
    }

    if (req.method === 'GET') {
        // Obtener estadísticas de imágenes
        try {
            const examsDir = path.join(process.cwd(), 'public', 'exams');
            const imageCache = loadImageCache();
            
            let totalImages = 0;
            let questionsWithImages = 0;
            let totalQuestions = 0;
            let downloadedImages = 0;

            const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json'));
            
            for (const file of files) {
                const filePath = path.join(examsDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                try {
                    const data = JSON.parse(content);
                    
                    if (!data.questions && !Array.isArray(data)) {
                        continue;
                    }
                    
                    const questions = data.questions || data;
                    
                    for (const question of questions) {
                        totalQuestions++;
                        let hasImages = false;
                        
                        // Verificar imagen de la pregunta
                        if (question.image && question.image.name) {
                            totalImages++;
                            hasImages = true;
                            if (imageCache[question.image.name]) {
                                downloadedImages++;
                            }
                        }
                        
                        // Verificar imágenes de las respuestas
                        if (question.answers && Array.isArray(question.answers)) {
                            for (const answer of question.answers) {
                                if (answer.image && answer.image.name) {
                                    totalImages++;
                                    hasImages = true;
                                    if (imageCache[answer.image.name]) {
                                        downloadedImages++;
                                    }
                                }
                            }
                        }
                        
                        if (hasImages) {
                            questionsWithImages++;
                        }
                    }
                } catch (error) {
                    console.warn(`Error procesando ${file}:`, error.message);
                }
            }

            const totalCacheSize = Object.values(imageCache).reduce((sum, img) => sum + (img.size || 0), 0);

            return res.status(200).json({
                totalQuestions,
                questionsWithImages,
                totalImages,
                downloadedImages,
                cacheSize: totalCacheSize,
                cacheSizeMB: (totalCacheSize / 1024 / 1024).toFixed(2)
            });
        } catch (error) {
            return res.status(500).json({ error: 'Error obteniendo estadísticas' });
        }
    }

    if (req.method === 'POST') {
        const { action } = req.body;
        
        if (action === 'download') {
            try {
                // Proceso de descarga de imágenes
                const examsDir = path.join(process.cwd(), 'public', 'exams');
                const imageCache = loadImageCache();
                
                let downloadedCount = 0;
                let failedCount = 0;
                
                const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json'));
                
                for (const file of files) {
                    const filePath = path.join(examsDir, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    try {
                        const data = JSON.parse(content);
                        const questions = data.questions || data;
                        
                        if (!Array.isArray(questions)) {
                            continue;
                        }
                        
                        for (const question of questions) {
                            // Procesar imagen de la pregunta
                            if (question.image && question.image.thumbs && question.image.name) {
                                const imageName = question.image.name;
                                const localPath = path.join(imagesDir, imageName);
                                
                                if (!imageCache[imageName] || !fs.existsSync(localPath)) {
                                    try {
                                        await downloadImage(question.image.thumbs.original, localPath);
                                        imageCache[imageName] = {
                                            downloaded: new Date().toISOString(),
                                            originalUrl: question.image.thumbs.original,
                                            size: fs.statSync(localPath).size
                                        };
                                        downloadedCount++;
                                        await new Promise(resolve => setTimeout(resolve, 200));
                                    } catch (error) {
                                        failedCount++;
                                    }
                                }
                            }
                            
                            // Procesar imágenes de las respuestas
                            if (question.answers && Array.isArray(question.answers)) {
                                for (const answer of question.answers) {
                                    if (answer.image && answer.image.thumbs && answer.image.name) {
                                        const imageName = answer.image.name;
                                        const localPath = path.join(imagesDir, imageName);
                                        
                                        if (!imageCache[imageName] || !fs.existsSync(localPath)) {
                                            try {
                                                await downloadImage(answer.image.thumbs.original, localPath);
                                                imageCache[imageName] = {
                                                    downloaded: new Date().toISOString(),
                                                    originalUrl: answer.image.thumbs.original,
                                                    size: fs.statSync(localPath).size
                                                };
                                                downloadedCount++;
                                                await new Promise(resolve => setTimeout(resolve, 200));
                                            } catch (error) {
                                                failedCount++;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.warn(`Error procesando ${file}:`, error.message);
                    }
                }
                
                saveImageCache(imageCache);
                
                return res.status(200).json({
                    message: 'Descarga completada',
                    downloaded: downloadedCount,
                    failed: failedCount
                });
            } catch (error) {
                return res.status(500).json({ error: 'Error descargando imágenes' });
            }
        }
        
        if (action === 'clear') {
            try {
                // Limpiar caché
                if (fs.existsSync(cacheFile)) {
                    fs.unlinkSync(cacheFile);
                }
                
                // Opcional: eliminar archivos de imágenes
                if (fs.existsSync(imagesDir)) {
                    const files = fs.readdirSync(imagesDir);
                    files.forEach(file => {
                        fs.unlinkSync(path.join(imagesDir, file));
                    });
                }
                
                return res.status(200).json({ message: 'Caché limpiado' });
            } catch (error) {
                return res.status(500).json({ error: 'Error limpiando caché' });
            }
        }
    }

    return res.status(405).json({ error: 'Método no permitido' });
}
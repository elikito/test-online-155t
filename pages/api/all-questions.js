import fs from 'fs';
import path from 'path';

// Función para detectar el tipo de formato
function detectFormat(data) {
  if (Array.isArray(data) && data[0]?.pregunta && data[0]?.opciones) {
    return 'legacy';
  }
  if (data.questions && Array.isArray(data.questions)) {
    return 'opositatest';
  }
  return 'unknown';
}

// Función para normalizar formato OpositaTest
function normalizeOpositaTestFormat(data, filename) {
  if (!data.questions || !Array.isArray(data.questions)) {
    return [];
  }

  return data.questions.map((question, index) => {
    // Crear opciones en formato a, b, c, d
    const opciones = {};
    const letters = ['a', 'b', 'c', 'd'];
    
    question.answers.forEach((answer, idx) => {
      if (idx < 4) {
        opciones[letters[idx]] = answer.declaration;
      }
    });

    // Encontrar la letra de la respuesta correcta
    const correctAnswerIndex = question.answers.findIndex(
      answer => answer.id === question.correctAnswerId
    );
    const respuesta_correcta = letters[correctAnswerIndex] || 'a';

    // Extraer tema de contents
    let tema = 'Sin tema';
    if (question.contents && question.contents.length > 0) {
      const content = question.contents[0];
      if (content.child?.child?.name) {
        tema = content.child.child.name;
      } else if (content.child?.name) {
        tema = content.child.name;
      } else {
        tema = content.name;
      }
    }

    // Manejar imagen de la pregunta
    let imagen = null;
    if (question.image && question.image.name) {
      // Verificar si la imagen existe localmente
      const localImagePath = path.join(process.cwd(), 'public', 'images', 'questions', question.image.name);
      if (fs.existsSync(localImagePath)) {
        imagen = `/images/questions/${question.image.name}`;
      }
    }

    // Manejar imágenes de las opciones
    const opcionesConImagen = {};
    question.answers.forEach((answer, idx) => {
      if (idx < 4) {
        const letter = letters[idx];
        opcionesConImagen[letter] = {
          texto: answer.declaration,
          imagen: null
        };
        
        if (answer.image && answer.image.name) {
          const localImagePath = path.join(process.cwd(), 'public', 'images', 'questions', answer.image.name);
          if (fs.existsSync(localImagePath)) {
            opcionesConImagen[letter].imagen = `/images/questions/${answer.image.name}`;
          }
        }
      }
    });

    return {
      id_pregunta: question.id.toString(),
      pregunta: question.declaration,
      opciones,
      opciones_con_imagen: opcionesConImagen,
      respuesta_correcta,
      tema,
      examen: data.title || filename.replace(/\.json$/, ''),
      imagen
    };
  });
}

// Función para normalizar formato legacy
function normalizeLegacyFormat(data, filename) {
  return data.map(question => ({
    ...question,
    examen: question.examen || filename.replace(/\.json$/, '')
  }));
}

export default function handler(req, res) {
  const examsDir = path.join(process.cwd(), 'public', 'exams');
  let allQuestions = [];

  try {
    const files = fs.readdirSync(examsDir).filter(f => f.endsWith('.json'));
    
    files.forEach(file => {
      const filePath = path.join(examsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      try {
        const data = JSON.parse(content);
        const format = detectFormat(data);
        
        let normalizedQuestions = [];
        
        switch (format) {
          case 'legacy':
            normalizedQuestions = normalizeLegacyFormat(data, file);
            break;
          case 'opositatest':
            normalizedQuestions = normalizeOpositaTestFormat(data, file);
            break;
          default:
            console.warn(`Formato no reconocido en ${file}`);
            return;
        }
        
        allQuestions = allQuestions.concat(normalizedQuestions);
        console.log(`✅ Procesado ${file}: ${normalizedQuestions.length} preguntas (formato: ${format})`);
        
      } catch (e) {
        console.warn(`❌ Error parsing ${file}:`, e.message);
      }
    });
    
    res.status(200).json(allQuestions);
  } catch (err) {
    console.error('Error cargando preguntas:', err);
    res.status(500).json({ error: 'No se pudieron cargar las preguntas.' });
  }
}
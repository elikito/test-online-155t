import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  const [examFiles, setExamFiles] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState({ preguntas: [], respuestas: [] });

  useEffect(() => {
    // Obtener la lista de exámenes disponibles desde el backend
    fetch('/api/exams')
      .then(res => res.json())
      .then(files => setExamFiles(files))
      .catch(() => setExamFiles([]));
  }, []);

  const shuffleArray = (array) => {
    return array
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
  };

const loadExam = async (filename) => {
  const res = await fetch(`/exams/${filename}`);
  const data = await res.json();
  const shuffled = shuffleArray(data);

  const saved = localStorage.getItem(`respuestas_${filename}`);
  let restored = shuffled;

  if (saved) {
    const savedAnswers = JSON.parse(saved);
    restored = shuffled.map(q => {
      const match = savedAnswers.find(sq => sq.id_pregunta === q.id_pregunta);
      return match ? { ...q, respuesta_usuario: match.respuesta_usuario } : q;
    });

    // Recalcular contador
    const correct = restored.filter(q => q.respuesta_usuario === q.respuesta_correcta).length;
    const incorrect = restored.filter(q => q.respuesta_usuario && q.respuesta_usuario !== q.respuesta_correcta).length;
    setCorrectCount(correct);
    setIncorrectCount(incorrect);
  }

  setQuestions(restored);
  setCurrent(0);
  setSelectedOption(restored[0].respuesta_usuario || null);
};

  const handleSelect = (e) => {
    const file = e.target.value;
    setSelectedExam(file);
    loadExam(file);
  };

const handleAnswer = (key) => {
  if (selectedOption !== null) return;
  setSelectedOption(key);

  const updatedQuestions = [...questions];
  updatedQuestions[current].respuesta_usuario = key;
  setQuestions(updatedQuestions);

  localStorage.setItem(`respuestas_${selectedExam}`, JSON.stringify(updatedQuestions));

  const correct = updatedQuestions[current].respuesta_correcta;
  if (key === correct) {
    setCorrectCount(prev => prev + 1);
  } else {
    setIncorrectCount(prev => prev + 1);
  }
};


  const nextQuestion = () => {
    setSelectedOption(null);
    setCurrent(prev => prev + 1);
  };

  const currentQuestion = questions[current];

  useEffect(() => {
    if (!search) {
      setSearchResults({ preguntas: [], respuestas: [] });
      return;
    }
    const lower = search.toLowerCase();
    const preguntas = questions.filter(q =>
      q.pregunta.toLowerCase().includes(lower)
    );
    const respuestas = [];
    questions.forEach((q, idx) => {
      Object.entries(q.opciones).forEach(([key, value]) => {
        if (value.toLowerCase().includes(lower)) {
          respuestas.push({ pregunta: q.pregunta, opcion: key, texto: value, index: idx });
        }
      });
    });
    setSearchResults({ preguntas, respuestas });
  }, [search, questions]);

  return (
    <div className="container mt-5">
      <h1 className="mb-4">Examen Online</h1>

      <div className="mb-3">
        <label className="form-label">Selecciona un examen:</label>
        <select className="form-select" onChange={handleSelect} value={selectedExam}>
          <option value="">-- Selecciona --</option>
          {examFiles.map((file, idx) => (
            <option key={idx} value={file}>{file}</option>
          ))}
        </select>
        {questions.length > 0 && (
          <>
            <button
              className="btn btn-warning mt-2 ms-2"
              onClick={() => {
                setCorrectCount(0);
                setIncorrectCount(0);
                const resetQuestions = questions.map(q => {
                  const { respuesta_usuario, ...rest } = q;
                  return rest;
                });
                setQuestions(resetQuestions);
                setCurrent(0);
                setSelectedOption(null);
                if (selectedExam) {
                  localStorage.removeItem(`respuestas_${selectedExam}`);
                }
              }}
            >
              Reiniciar test
            </button>
            <button
              className="btn btn-info mt-2 ms-2"
              onClick={() => {
                if (!currentQuestion) return;
                // Construir el texto a buscar
                let texto = `Pregunta: ${currentQuestion.pregunta}\n`;
                Object.entries(currentQuestion.opciones).forEach(([key, value]) => {
                  texto += `${key.toUpperCase()}: ${value}\n`;
                });
                // Buscar en Google (abrir nueva pestaña con el texto)
                const url = `https://www.google.com/search?q=${encodeURIComponent('ChatGPT ' + texto)}`;
                window.open(url, '_blank');
              }}
            >
              Buscar en ChatGPT
            </button>
          </>
        )}
      </div>

      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar en preguntas o respuestas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {search && (
        <div className="mb-4">
          <h5>Preguntas con el literal buscado</h5>
          {searchResults.preguntas.length === 0 && <p>No hay coincidencias.</p>}
          <ul>
            {searchResults.preguntas.map((q, idx) => (
              <li key={q.id_pregunta || idx}>
                <button
                  className="btn btn-link p-0"
                  onClick={() => {
                    const i = questions.findIndex(qq => qq.id_pregunta === q.id_pregunta);
                    setCurrent(i);
                    setSelectedOption(questions[i].respuesta_usuario || null);
                  }}
                >
                  {q.pregunta}
                </button>
              </li>
            ))}
          </ul>
          <h5>Respuestas con el texto buscado</h5>
          {searchResults.respuestas.length === 0 && <p>No hay coincidencias.</p>}
          <ul>
            {searchResults.respuestas.map((r, idx) => (
              <li key={idx}>
                <button
                  className="btn btn-link p-0"
                  onClick={() => {
                    setCurrent(r.index);
                    setSelectedOption(questions[r.index].respuesta_usuario || null);
                  }}
                >
                  Pregunta: {r.pregunta} <br />
                  <strong>{r.opcion.toUpperCase()}:</strong> {r.texto}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {currentQuestion && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Pregunta {current + 1}</h5>
            <p className="card-text">{currentQuestion.pregunta}</p>
            <p><strong>Tema:</strong> {currentQuestion.tema || 'No especificado'}</p>
            <ul className="list-group">
              {Object.entries(currentQuestion.opciones).map(([key, value]) => {
                let className = "list-group-item";
                if (selectedOption) {
                  if (key === currentQuestion.respuesta_correcta) {
                    className += " list-group-item-success";
                  } else if (key === selectedOption) {
                    className += " list-group-item-danger";
                  }
                }
                return (
                  <li
                    key={key}
                    className={className}
                    style={{ cursor: selectedOption ? 'default' : 'pointer' }}
                    onClick={() => handleAnswer(key)}
                  >
                    <strong>{key.toUpperCase()}:</strong> {value}
                  </li>
                );
              })}
            </ul>

            {selectedOption && current < questions.length - 1 && (
              <button className="btn btn-primary mt-3" onClick={nextQuestion}>Siguiente</button>
            )}
            {selectedOption && current === questions.length - 1 && (
              <p className="mt-3 text-success">¡Has llegado al final del examen!</p>
            )}
          </div>
        </div>
      )}

	{questions.length > 0 && (
		<div className="mt-4 text-center">
			<p><strong>Correctas:</strong> {correctCount} | <strong>Incorrectas:</strong> {incorrectCount}</p>
		</div>
	)}

	{questions.length > 0 && (
		<div className="mt-4">
			<h5>Navegación de preguntas</h5>
			<div className="d-flex flex-wrap gap-2">
			{questions.map((q, index) => {
				let btnClass = "btn btn-outline-secondary";
				if (index < current) {
				const userAnswered = index < current;
				const isCorrect = q.respuesta_usuario === q.respuesta_correcta;
				if (userAnswered) {
					btnClass = isCorrect ? "btn btn-success" : "btn btn-danger";
				}
				} else if (index === current) {
				btnClass = "btn btn-primary";
				}

				return (
				<button
					key={index}
					className={btnClass}
					style={{ width: '40px', height: '40px', padding: 0 }}
					onClick={() => {
					setCurrent(index);
					setSelectedOption(questions[index].respuesta_usuario || null);
					}}
				>
					{index + 1}
				</button>
				);
			})}
			</div>
		</div>
	)}

      <footer className="mt-5 mb-3 text-center text-muted">
        <small>Examen creado por [Tu Nombre] - Todos los derechos reservados &copy; {new Date().getFullYear()}</small>
      </footer>
    </div>
  );
}

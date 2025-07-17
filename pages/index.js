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

  useEffect(() => {
    setExamFiles(['examen_prueba.json']); // Simulación
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
    setQuestions(shuffled);
    setCurrent(0);
    setSelectedOption(null);
    setCorrectCount(0);
    setIncorrectCount(0);
  };

  const handleSelect = (e) => {
    const file = e.target.value;
    setSelectedExam(file);
    loadExam(file);
  };

  const handleAnswer = (key) => {
    if (selectedOption !== null) return; // Evita doble clic
    setSelectedOption(key);
    const correct = questions[current].respuesta_correcta;
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
      </div>

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
    </div>
  );
}

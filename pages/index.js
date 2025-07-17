import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  const [examFiles, setExamFiles] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Simula lectura de archivos JSON en /public/exams
    setExamFiles(['examen_prueba.json']); // Esto se puede automatizar con una API si se usa backend
  }, []);

  const loadExam = async (filename) => {
    const res = await fetch(`/exams/${filename}`);
    const data = await res.json();
    setQuestions(data);
    setCurrent(0);
  };

  const handleSelect = (e) => {
    const file = e.target.value;
    setSelectedExam(file);
    loadExam(file);
  };

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

      {questions.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">Pregunta {current + 1}</h5>
            <p className="card-text">{questions[current].pregunta}</p>
            <ul className="list-group">
              {Object.entries(questions[current].opciones).map(([key, value]) => (
                <li key={key} className="list-group-item">{key.toUpperCase()}: {value}</li>
              ))}
            </ul>
            <div className="mt-3">
              {current < questions.length - 1 && (
                <button className="btn btn-primary" onClick={() => setCurrent(current + 1)}>Siguiente</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

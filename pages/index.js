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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newQuestions, setNewQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState({ a: '', b: '', c: '', d: '' });
  const [newCorrect, setNewCorrect] = useState('a');
  const [showTemarioPanel, setShowTemarioPanel] = useState(false);
  const [temarioAuth, setTemarioAuth] = useState(false);
  const [temarioInput, setTemarioInput] = useState('');
  const [temarioError, setTemarioError] = useState('');
  const [temarioUrl, setTemarioUrl] = useState('');
  const [temas, setTemas] = useState([]);
  const [temaSearch, setTemaSearch] = useState('');
  const [newTema, setNewTema] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [errorPregunta, setErrorPregunta] = useState('');

  // Añadir estado para el test personalizado
  const [showCustomTestPanel, setShowCustomTestPanel] = useState(false);
  const [customNumQuestions, setCustomNumQuestions] = useState(10);
  const [customTema, setCustomTema] = useState('');
  const [customExam, setCustomExam] = useState('');
  const [customQuestions, setCustomQuestions] = useState([]);
  const [customTemas, setCustomTemas] = useState([]);
  const [customTemaCounts, setCustomTemaCounts] = useState({});
  const [customExamList, setCustomExamList] = useState([]);
  const [customLoading, setCustomLoading] = useState(false);

  useEffect(() => {
    // Obtener la lista de exámenes disponibles desde el backend
    // volvi
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
    setSelectedOption(restored.length > 0 ? restored[0].respuesta_usuario || null : null);
  };

  const handleSelect = (e) => {
    const file = e.target.value;
    setSelectedExam(file);
    loadExam(file);
  };

  const handleAnswer = (key) => {
    // No permitir responder si la pregunta ya tiene respuesta
    if (questions[current].respuesta_usuario) return;
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

  const addNewQuestion = () => {
    if (!newQuestionText.trim()) return;
    setNewQuestions([
      ...newQuestions,
      {
        pregunta: newQuestionText,
        opciones: { ...newOptions },
        respuesta_correcta: newCorrect,
        id_pregunta: Date.now() + Math.random()
      }
    ]);
    setNewQuestionText('');
    setNewOptions({ a: '', b: '', c: '', d: '' });
    setNewCorrect('a');
  };

  const downloadTest = () => {
    // Genera el nombre base del test (sin espacios ni caracteres raros)
    const baseName = (newTestTitle || 'nuevo_test').replace(/[^a-zA-Z0-9]/g, '');
    const preguntas = newQuestions.map((q, idx) => ({
      id: idx + 1,
      id_pregunta: `${baseName}_${(idx + 1).toString().padStart(2, '0')}`,
      pregunta: q.pregunta,
      opciones: { ...q.opciones },
      respuesta_correcta: q.respuesta_correcta,
      tema: q.tema
    }));
    const blob = new Blob([JSON.stringify(preguntas, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleTemarioLogin = async () => {
    setTemarioError('');
    const res = await fetch('/api/temario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: temarioInput })
    });
    if (res.ok) {
      const data = await res.json();
      setTemarioAuth(true);
      setTemarioUrl(data.url);
    } else {
      setTemarioError('Contraseña incorrecta');
    }
  };

  // Cargar temas desde temario.txt al abrir el panel de crear test
  useEffect(() => {
    if (showCreatePanel && temas.length === 0) {
      fetch('/temario.txt')
        .then(res => res.text())
        .then(txt => {
          // Solo líneas con formato "1.1.1 - ..." o "1.1 - ..." o "1 - ..."
          const lines = txt.split('\n')
            .map(l => l.trim())
            .filter(l => /^\d+(\.\d+)*\s*-\s+/.test(l));
          setTemas(lines);
        });
    }
  }, [showCreatePanel]);

  const addOrEditQuestion = () => {
    setErrorPregunta('');
    if (!newQuestionText.trim() || !newTema) {
      setErrorPregunta('Rellena la pregunta y selecciona un tema.');
      return;
    }
    // Verifica que las 4 opciones estén rellenas
    if (['a', 'b', 'c', 'd'].some(opt => !newOptions[opt].trim())) {
      setErrorPregunta('Debes rellenar las 4 opciones.');
      return;
    }
    if (editIndex !== null) {
      // Editar pregunta existente
      const updated = [...newQuestions];
      updated[editIndex] = {
        ...updated[editIndex],
        pregunta: newQuestionText,
        opciones: { ...newOptions },
        respuesta_correcta: newCorrect,
        tema: newTema
      };
      setNewQuestions(updated);
      setEditIndex(null);
    } else {
      // Añadir nueva pregunta con id secuencial
      const id = (newQuestions.length + 1).toString().padStart(2, '0');
      setNewQuestions([
        ...newQuestions,
        {
          pregunta: newQuestionText,
          opciones: { ...newOptions },
          respuesta_correcta: newCorrect,
          tema: newTema,
          id_pregunta: id
        }
      ]);
    }
    setNewQuestionText('');
    setNewOptions({ a: '', b: '', c: '', d: '' });
    setNewCorrect('a');
    setNewTema('');
    setErrorPregunta('');
  };

  const handleEdit = idx => {
    const q = newQuestions[idx];
    setNewQuestionText(q.pregunta);
    setNewOptions({ ...q.opciones });
    setNewCorrect(q.respuesta_correcta);
    setNewTema(q.tema || '');
    setEditIndex(idx);
    setErrorPregunta('');
  };

  const handleDelete = idx => {
    const updated = newQuestions.filter((_, i) => i !== idx)
      .map((q, i) => ({
        ...q,
        id_pregunta: (i + 1).toString().padStart(2, '0') // Recalcula ids
      }));
    setNewQuestions(updated);
    if (editIndex === idx) {
      setEditIndex(null);
      setNewQuestionText('');
      setNewOptions({ a: '', b: '', c: '', d: '' });
      setNewCorrect('a');
      setNewTema('');
    }
  };

  // Cargar todos los exámenes y temas al abrir el panel personalizado
  useEffect(() => {
    if (showCustomTestPanel) {
      setCustomLoading(true);
      fetch('/api/all-questions')
        .then(res => res.json())
        .then(allQuestions => {
          setCustomQuestions(allQuestions);

          // Temas únicos y conteo
          const temaCounts = {};
          allQuestions.forEach(q => {
            temaCounts[q.tema] = (temaCounts[q.tema] || 0) + 1;
          });
          setCustomTemaCounts(temaCounts);
          setCustomTemas(Object.keys(temaCounts).sort());

          // Exámenes únicos
          const exams = [...new Set(allQuestions.map(q => q.examen))];
          setCustomExamList(exams);
          setCustomLoading(false);
        });
    }
  }, [showCustomTestPanel]);

  // Filtrar preguntas según filtros seleccionados
  const getFilteredCustomQuestions = () => {
    let filtered = customQuestions;
    if (customExam) filtered = filtered.filter(q => q.examen === customExam);
    if (customTema) filtered = filtered.filter(q => q.tema === customTema);
    return filtered;
  };

  const [customTestQuestions, setCustomTestQuestions] = useState([]);
  const [customTestStarted, setCustomTestStarted] = useState(false);
  const [customTestCurrent, setCustomTestCurrent] = useState(0);
  const [customTestSelected, setCustomTestSelected] = useState(null);
  const [customTestCorrect, setCustomTestCorrect] = useState(0);
  const [customTestIncorrect, setCustomTestIncorrect] = useState(0);

  const startCustomTest = () => {
    const filtered = getFilteredCustomQuestions();
    const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, customNumQuestions);
    setCustomTestQuestions(shuffled);
    setCustomTestStarted(true);
    setCustomTestCurrent(0);
    setCustomTestSelected(null);
    setCustomTestCorrect(0);
    setCustomTestIncorrect(0);
  };

  const handleCustomTestAnswer = (key) => {
    if (customTestQuestions[customTestCurrent].respuesta_usuario) return;
    setCustomTestSelected(key);
    const updated = [...customTestQuestions];
    updated[customTestCurrent].respuesta_usuario = key;
    setCustomTestQuestions(updated);
    if (key === updated[customTestCurrent].respuesta_correcta) {
      setCustomTestCorrect(prev => prev + 1);
    } else {
      setCustomTestIncorrect(prev => prev + 1);
    }
  };

  const nextCustomTestQuestion = () => {
    setCustomTestSelected(null);
    setCustomTestCurrent(prev => prev + 1);
  };

  return (
    <div className="container-fluid p-0" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar y overlay */}
      <div>
        <button
          className="btn btn-outline-secondary m-3"
          style={{ position: 'fixed', top: 10, left: 10, zIndex: 1051 }}
          onClick={() => setMenuOpen(true)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        {/* Overlay */}
        {menuOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0, left: 0, width: '100vw', height: '100vh',
              background: 'rgba(0,0,0,0.3)', zIndex: 1050
            }}
            onClick={() => setMenuOpen(false)}
          />
        )}
        {/* Sidebar */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: menuOpen ? 0 : '-220px',
            width: 220,
            height: '100vh',
            background: '#fff',
            boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
            zIndex: 1052,
            transition: 'left 0.2s'
          }}
        >
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <strong>Menú</strong>
            <button className="btn-close" onClick={() => setMenuOpen(false)} />
          </div>
          <div className="p-3 d-grid gap-2">
            <button
              className="btn btn-warning"
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
                setMenuOpen(false);
              }}
              disabled={questions.length === 0}
            >
              Reiniciar test
            </button>
            <button
              className="btn btn-info"
              onClick={() => {
                if (!currentQuestion) return;
                let texto = `Pregunta: ${currentQuestion.pregunta}\n`;
                Object.entries(currentQuestion.opciones).forEach(([key, value]) => {
                  texto += `${key.toUpperCase()}: ${value}\n`;
                });
                const url = `https://www.google.com/search?q=${encodeURIComponent('ChatGPT ' + texto)}`;
                window.open(url, '_blank');
                setMenuOpen(false);
              }}
              disabled={questions.length === 0}
            >
              Señor GPT
            </button>
            <button
              className="btn btn-success"
              onClick={() => setShowCreatePanel(true)}
            >
              Crear nuevo test
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowTemarioPanel(true)}
            >
              Ver Temario
            </button>
            {/* Botón para test personalizado */}
            <button
              className="btn btn-outline-dark"
              onClick={() => setShowCustomTestPanel(true)}
            >
              Test personalizado
            </button>
            <hr />
            <button
              className="btn btn-outline-secondary"
              onClick={() => {
                window.location.href = '/';
                setMenuOpen(false);
              }}
            >
              Test
            </button>
          </div>
        </div>
      </div>

      <div className="container mt-5" style={{ flex: 1 }}>
        <h1 className="mb-4">Test AGE</h1>

        <div className="mb-3">
          <label className="form-label">Selecciona un examen:</label>
          <select className="form-select" onChange={handleSelect} value={selectedExam}>
            <option value="">-- Selecciona --</option>
            {examFiles.map((file, idx) => (
              <option key={idx} value={file}>{file}</option>
            ))}
          </select>
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
            <h5>Preguntas encontradas</h5>
            {searchResults.preguntas.length === 0 && <p>No hay coincidencias.</p>}
            <ul>
              {searchResults.preguntas.map((q, idx) => (
                <li key={q.id_pregunta || idx}>
                  <button
                    className="btn btn-link p-0"
                    onClick={() => {
                      const i = questions.findIndex(qq => qq.id_pregunta === q.id_pregunta);
                      if (i !== -1) {
                        setCurrent(i);
                        setSelectedOption(questions[i].respuesta_usuario || null);
                      }
                    }}
                  >
                    {q.pregunta}
                  </button>
                </li>
              ))}
            </ul>
            <h5>Respuestas encontradas</h5>
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
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {questions.map((q, index) => {
                let btnClass = "btn btn-outline-secondary";
                if (index === current) {
                  btnClass += " active";
                } else if (q.respuesta_usuario) {
                  btnClass += q.respuesta_usuario === q.respuesta_correcta ? " btn-success" : " btn-danger";
                }
                // Formato 01, 02, ..., 10, 11...
                const num = (index + 1).toString().padStart(2, '0');
                return (
                  <button
                    key={index}
                    className={btnClass}
                    style={{
                      width: 44,
                      height: 44,
                      padding: 0,
                      fontWeight: 'bold',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: 18,
                      flex: '0 0 44px'
                    }}
                    onClick={() => {
                      setCurrent(index);
                      setSelectedOption(questions[index].respuesta_usuario || null);
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Panel para crear nuevo test */}
      {showCreatePanel && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 400,
            height: '100vh',
            background: '#fff',
            zIndex: 2000,
            boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
            padding: 24,
            overflowY: 'auto'
          }}
        >
          <h4>Crear nuevo test</h4>
          <button className="btn-close float-end" onClick={() => {
            setShowCreatePanel(false);
            setEditIndex(null);
            setNewQuestionText('');
            setNewOptions({ a: '', b: '', c: '', d: '' });
            setNewCorrect('a');
            setNewTema('');
            setErrorPregunta('');
          }} />
          <div className="mb-3">
            <label className="form-label">Título del test</label>
            <input
              className="form-control"
              value={newTestTitle}
              onChange={e => setNewTestTitle(e.target.value)}
            />
          </div>
          <hr />
          <h5>{editIndex !== null ? 'Editar pregunta' : 'Añadir pregunta'}</h5>
          <div className="mb-2">
            <input
              className="form-control mb-2"
              placeholder="Texto de la pregunta"
              value={newQuestionText}
              onChange={e => setNewQuestionText(e.target.value)}
            />
            {/* Selector de tema con buscador */}
            <input
              className="form-control mb-2"
              placeholder="Buscar tema..."
              value={temaSearch}
              onChange={e => setTemaSearch(e.target.value)}
            />
            <select
              className="form-select mb-2"
              value={newTema}
              onChange={e => setNewTema(e.target.value)}
            >
              <option value="">-- Selecciona tema --</option>
              {temas
                .filter(t => t.toLowerCase().includes(temaSearch.toLowerCase()))
                .map((t, i) => (
                  <option key={i} value={t}>{t}</option>
                ))}
            </select>
            {['a', 'b', 'c', 'd'].map(opt => (
              <div className="input-group mb-2" key={opt}>
                <span className="input-group-text">{opt.toUpperCase()}</span>
                <input
                  className="form-control"
                  placeholder={`Opción ${opt.toUpperCase()}`}
                  value={newOptions[opt]}
                  onChange={e => setNewOptions({ ...newOptions, [opt]: e.target.value })}
                />
                <span className="input-group-text">
                  <input
                    type="radio"
                    name="correct"
                    checked={newCorrect === opt}
                    onChange={() => setNewCorrect(opt)}
                  />
                  Correcta
                </span>
              </div>
            ))}
            {errorPregunta && <div className="text-danger mb-2">{errorPregunta}</div>}
            <button
              className="btn btn-primary"
              onClick={addOrEditQuestion}
            >
              {editIndex !== null ? 'Guardar cambios' : 'Añadir pregunta'}
            </button>
            {editIndex !== null && (
              <button
                className="btn btn-secondary ms-2"
                onClick={() => {
                  setEditIndex(null);
                  setNewQuestionText('');
                  setNewOptions({ a: '', b: '', c: '', d: '' });
                  setNewCorrect('a');
                  setNewTema('');
                  setErrorPregunta('');
                }}
              >
                Cancelar
              </button>
            )}
          </div>
          <hr />
          <h6>Preguntas añadidas: {newQuestions.length}</h6>
          <ul className="list-group mb-2">
            {newQuestions.map((q, idx) => (
              <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>{q.id_pregunta}.</strong> {q.pregunta}
                  <br />
                  <small className="text-muted">{q.tema}</small>
                </div>
                <div>
                  <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(idx)}>Editar</button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(idx)}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
          <button
            className="btn btn-success mt-3"
            onClick={downloadTest}
            disabled={!newTestTitle || newQuestions.length === 0}
          >
            Descargar test en formato Jeison
          </button>
        </div>
      )}

      {/* Panel para ver temario */}
      {showTemarioPanel && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 500,
            height: '100vh',
            background: '#fff',
            zIndex: 3000,
            boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
            padding: 24,
            overflowY: 'auto'
          }}
        >
          <h4>Temario</h4>
          <button className="btn-close float-end" onClick={() => {
            setShowTemarioPanel(false);
            setTemarioAuth(false);
            setTemarioInput('');
            setTemarioError('');
          }} />
          {!temarioAuth ? (
            <div className="mt-4">
              <p>Introduce la contraseña para acceder al temario:</p>
              <input
                type="password"
                className="form-control mb-2"
                value={temarioInput}
                onChange={e => setTemarioInput(e.target.value)}
              />
              {temarioError && <div className="text-danger mb-2">{temarioError}</div>}
              <button className="btn btn-primary" onClick={handleTemarioLogin}>
                Acceder
              </button>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <p>
                El temario se encuentra en Notion.<br />
                <a
                  href={temarioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                >
                  Abrir Temario en Notion
                </a>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Panel para test personalizado */}
      {showCustomTestPanel && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: 500,
            height: '100vh',
            background: '#fff',
            zIndex: 4000,
            boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
            padding: 24,
            overflowY: 'auto'
          }}
        >
          <h4>Test personalizado</h4>
          <button className="btn-close float-end" onClick={() => {
            setShowCustomTestPanel(false);
            setCustomTestStarted(false);
            setCustomTestQuestions([]);
            setCustomTestCurrent(0);
            setCustomTestSelected(null);
          }} />
          {!customTestStarted ? (
            <div>
              {customLoading ? (
                <div className="my-4 text-center">
                  <div className="spinner-border" />
                  <div>Cargando preguntas...</div>
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <label className="form-label">Examen</label>
                    <select
                      className="form-select"
                      value={customExam}
                      onChange={e => setCustomExam(e.target.value)}
                    >
                      <option value="">-- Todos --</option>
                      {customExamList.map((ex, i) => (
                        <option key={i} value={ex}>{ex}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tema</label>
                    <select
                      className="form-select"
                      value={customTema}
                      onChange={e => setCustomTema(e.target.value)}
                    >
                      <option value="">-- Todos --</option>
                      {customTemas.map((t, i) => (
                        <option key={i} value={t}>
                          {t} ({customTemaCounts[t] || 0} preguntas)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Número de preguntas</label>
                    <input
                      type="number"
                      className="form-control"
                      min={1}
                      max={Math.max(1, getFilteredCustomQuestions().length)}
                      value={customNumQuestions}
                      onChange={e => setCustomNumQuestions(Number(e.target.value))}
                    />
                    <small className="text-muted">
                      Hay {getFilteredCustomQuestions().length} preguntas disponibles con estos filtros.
                    </small>
                  </div>
                  <button
                    className="btn btn-success"
                    disabled={getFilteredCustomQuestions().length === 0}
                    onClick={startCustomTest}
                  >
                    Comenzar test
                  </button>
                </>
              )}
            </div>
          ) : (
            <div>
              {customTestQuestions.length > 0 && (
                <div className="card mb-3">
                  <div className="card-body">
                    <h5 className="card-title">Pregunta {customTestCurrent + 1}</h5>
                    <p className="card-text">{customTestQuestions[customTestCurrent].pregunta}</p>
                    <p><strong>Tema:</strong> {customTestQuestions[customTestCurrent].tema}</p>
                    <ul className="list-group">
                      {Object.entries(customTestQuestions[customTestCurrent].opciones).map(([key, value]) => {
                        let className = "list-group-item";
                        if (customTestSelected) {
                          if (key === customTestQuestions[customTestCurrent].respuesta_correcta) {
                            className += " list-group-item-success";
                          } else if (key === customTestSelected) {
                            className += " list-group-item-danger";
                          }
                        }
                        return (
                          <li
                            key={key}
                            className={className}
                            style={{ cursor: customTestSelected ? 'default' : 'pointer' }}
                            onClick={() => handleCustomTestAnswer(key)}
                          >
                            <strong>{key.toUpperCase()}:</strong> {value}
                          </li>
                        );
                      })}
                    </ul>
                    {customTestSelected && customTestCurrent < customTestQuestions.length - 1 && (
                      <button className="btn btn-primary mt-3" onClick={nextCustomTestQuestion}>Siguiente</button>
                    )}
                    {customTestSelected && customTestCurrent === customTestQuestions.length - 1 && (
                      <p className="mt-3 text-success">¡Has llegado al final del test personalizado!</p>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-4 text-center">
                <p><strong>Correctas:</strong> {customTestCorrect} | <strong>Incorrectas:</strong> {customTestIncorrect}</p>
              </div>
              <div className="mt-4">
                <h5>Navegación de preguntas</h5>
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {customTestQuestions.map((q, index) => {
                    let btnClass = "btn btn-outline-secondary";
                    if (index === customTestCurrent) {
                      btnClass += " active";
                    } else if (q.respuesta_usuario) {
                      btnClass += q.respuesta_usuario === q.respuesta_correcta ? " btn-success" : " btn-danger";
                    }
                    const num = (index + 1).toString().padStart(2, '0');
                    return (
                      <button
                        key={index}
                        className={btnClass}
                        style={{
                          width: 44,
                          height: 44,
                          padding: 0,
                          fontWeight: 'bold',
                          fontVariantNumeric: 'tabular-nums',
                          fontSize: 18,
                          flex: '0 0 44px'
                        }}
                        onClick={() => {
                          setCustomTestCurrent(index);
                          setCustomTestSelected(q.respuesta_usuario || null);
                        }}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-light text-center text-lg-start mt-auto py-3">
        <div className="container">
          <p className="text-muted mb-0">- 2025 Test AGE -</p>
        </div>
      </footer>
    </div>
  );
}

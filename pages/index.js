import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  // Estado para controlar la vista principal o subpaneles
  const [view, setView] = useState('');
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
  // Añade esta línea:
  const [customFontSize, setCustomFontSize] = useState(18);
  const [customLoading, setCustomLoading] = useState(false);

  // Añadir estado para el ancho del panel
  const [panelWidth, setPanelWidth] = useState(500);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  // Añadir estado para el popup de confirmación
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  // Nueva línea para controlar el número de filas de navegación
  const [navRows, setNavRows] = useState(5); // Por defecto 5 filas visibles

  // Función para mostrar confirmación personalizada
  const showCustomConfirm = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmDialog(true);
  };

  // Función para manejar la confirmación
  const handleConfirm = (confirmed) => {
    setShowConfirmDialog(false);
    if (confirmed && confirmAction) {
      confirmAction();
    }
    setConfirmAction(null);
    setConfirmMessage('');
  };

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

  // Modificar la función copiarPreguntaActual
  const copiarPreguntaActual = (pregunta) => {
    if (!pregunta) return;
    let texto = `Pregunta: ${pregunta.pregunta}\n`;
    Object.entries(pregunta.opciones).forEach(([key, value]) => {
      texto += `${key.toUpperCase()}: ${value}\n`;
    });
    navigator.clipboard.writeText(texto)
      .then(() => {
        setShowCopiedMessage(true);
        setTimeout(() => setShowCopiedMessage(false), 2000);
      })
      .catch(err => console.error("No se pudo copiar"));
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
  if (view === 'personalizado') {
    setCustomLoading(true);
    fetch('/api/all-questions')
      .then(res => res.json())
      .then(allQuestions => {
        setCustomQuestions(allQuestions);

        const temaCounts = {};
        allQuestions.forEach(q => {
          temaCounts[q.tema] = (temaCounts[q.tema] || 0) + 1;
        });
        setCustomTemaCounts(temaCounts);
        setCustomTemas(Object.keys(temaCounts).sort());

        const exams = [...new Set(allQuestions.map(q => q.examen))];
        setCustomExamList(exams);
        setCustomLoading(false);
      });
    }
  }, [view]);

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

  function TestPanel({ questions, current, setCurrent, selectedOption, setSelectedOption, handleAnswer, nextQuestion, correctCount, incorrectCount, copiarPreguntaActual, reiniciarTest, handleSenorGPT, crearNuevoTest, showTopButtons = false, customFontSize = 18 }) {
    const currentQuestion = questions[current];

    // --- Panel de navegación regulable ---
    const BUTTON_SIZE = 36;
    const GAP_SIZE = 4; // gap-1 ~ 4px
    const BUTTONS_PER_ROW = 8;

    // Calcula filas totales y visibles
    const totalRows = Math.ceil(questions.length / BUTTONS_PER_ROW);
    const maxRows = Math.min(15, totalRows);
    const minRows = 1;

    // Estado para filas visibles (usa el estado global si lo tienes, si no, usa local)
    const [navRowsLocal, setNavRowsLocal] = useState(Math.min(5, totalRows));
    // Si usas navRows global, reemplaza navRowsLocal por navRows y setNavRows

    // Si quieres que el ajuste sea por test, usa navRowsLocal, si global, usa navRows

    const visibleRows = Math.max(minRows, Math.min(navRowsLocal, maxRows));
    const panelHeight = visibleRows * (BUTTON_SIZE + GAP_SIZE);
    const needsScroll = totalRows > visibleRows;

    return (
      <>
        {currentQuestion && (
          <div className="card" style={{ marginBottom: '120px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 0, margin: 0 }}>
            <div className="card-body" style={{ fontSize: customFontSize }}>
              <h5 className="card-title">Pregunta {current + 1}</h5>
              <p><strong>Tema:</strong> {currentQuestion.tema || 'No especificado'}</p>
              <p className="card-text">{currentQuestion.pregunta}</p>
              <ul className="list-group" style={{ marginBottom: 0 }}>
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
                      style={{ cursor: selectedOption ? 'default' : 'pointer', pointerEvents: selectedOption ? 'none' : 'auto' }}
                      onClick={() => !selectedOption && handleAnswer(key)}
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

        {/* Barra inferior fija */}
        <div 
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #dee2e6',
            padding: '15px',
            zIndex: 1000,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <div className="container-fluid">
            {/* Primera fila: Contadores y botones de navegación */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-3">
                <span><strong>Correctas:</strong> {correctCount}</span>
                <span><strong>Incorrectas:</strong> {incorrectCount}</span>
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    const newCurrent = current - 1;
                    if (newCurrent >= 0 && newCurrent < questions.length) {
                      setCurrent(newCurrent);
                      setSelectedOption(questions[newCurrent].respuesta_usuario || null);
                    }
                  }}
                  disabled={current === 0}
                >
                  <span role="img" aria-label="anterior">⬅️</span>
                </button>
                <button 
                  className="btn btn-outline-primary btn-sm"
                  onClick={() => {
                    const newCurrent = current + 1;
                    if (newCurrent >= 0 && newCurrent < questions.length) {
                      setCurrent(newCurrent);
                      setSelectedOption(questions[newCurrent].respuesta_usuario || null);
                    }
                  }}
                  disabled={current === questions.length - 1}
                >
                  <span role="img" aria-label="siguiente">➡️</span>
                </button>
              </div>
            </div>

            {/* Controles para regular filas */}
            <div className="d-flex justify-content-center align-items-center mb-2 gap-2">
              <button
                className="btn btn-light btn-sm"
                disabled={navRowsLocal <= minRows}
                onClick={() => setNavRowsLocal(r => Math.max(minRows, r - 1))}
                title="Reducir filas"
              >-</button>
              <span style={{ minWidth: 60, textAlign: 'center' }}>
                Filas: {visibleRows}
              </span>
              <button
                className="btn btn-light btn-sm"
                disabled={navRowsLocal >= Math.min(15, totalRows)}
                onClick={() => setNavRowsLocal(r => Math.min(15, r + 1, totalRows))}
                title="Aumentar filas"
              >+</button>
            </div>

            {/* Panel de navegación numérica */}
            <div
              className="d-flex flex-wrap gap-1 justify-content-center"
              style={{
                height: `${panelHeight}px`,
                overflowY: needsScroll ? 'auto' : 'hidden',
                transition: 'height 0.2s'
              }}
            >
              {questions.map((q, index) => {
                let btnClass = "btn btn-outline-secondary btn-sm";
                if (index === current) {
                  btnClass = "btn btn-primary btn-sm";
                } else if (q.respuesta_usuario) {
                  btnClass = q.respuesta_usuario === q.respuesta_correcta 
                    ? "btn btn-success btn-sm" 
                    : "btn btn-danger btn-sm";
                }
                const num = (index + 1).toString().padStart(2, '0');
                return (
                  <button
                    key={index}
                    className={btnClass}
                    style={{
                      width: '36px',
                      height: '36px',
                      padding: 0,
                      fontWeight: 'bold',
                      fontSize: '12px',
                      flex: '0 0 36px'
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
        </div>
      </>
    );
  }

  // Nuevo estado para el modo repaso
  const [reviewMode, setReviewMode] = useState('');
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [markedQuestions, setMarkedQuestions] = useState([]);
  const [infiniteQuestions, setInfiniteQuestions] = useState([]);
  const [infiniteCurrent, setInfiniteCurrent] = useState(0);

  // Añade estos estados para el modo infinito
  const [infiniteSelected, setInfiniteSelected] = useState(null);
  const [infiniteCorrect, setInfiniteCorrect] = useState(0);
  const [infiniteIncorrect, setInfiniteIncorrect] = useState(0);

  // Cuando cambie de pregunta, actualiza la opción seleccionada
  useEffect(() => {
    if (reviewMode === 'infinito' && infiniteQuestions.length > 0) {
      setInfiniteSelected(infiniteQuestions[infiniteCurrent]?.respuesta_usuario || null);
    }
  }, [infiniteCurrent, infiniteQuestions, reviewMode]);

  // Maneja la respuesta en modo infinito y actualiza contadores
  const handleInfiniteAnswer = (key) => {
    if (infiniteQuestions[infiniteCurrent]?.respuesta_usuario) return;
    setInfiniteSelected(key);
    const updated = [...infiniteQuestions];
    updated[infiniteCurrent] = {
      ...updated[infiniteCurrent],
      respuesta_usuario: key
    };
    setInfiniteQuestions(updated);

    if (key === updated[infiniteCurrent].respuesta_correcta) {
      setInfiniteCorrect(prev => prev + 1);
    } else {
      setInfiniteIncorrect(prev => prev + 1);
    }
  };

  // Al reiniciar el test infinito, reinicia los contadores también
  const reiniciarInfinito = () => {
    setInfiniteQuestions(infiniteQuestions.map(q => {
      const { respuesta_usuario, ...rest } = q;
      return rest;
    }));
    setInfiniteCurrent(0);
    setInfiniteSelected(null);
    setInfiniteCorrect(0);
    setInfiniteIncorrect(0);
  };

  // Guardar preguntas falladas al terminar un test
  useEffect(() => {
    if (view === 'cargar' && questions.length > 0) {
      const failed = questions.filter(q => q.respuesta_usuario && q.respuesta_usuario !== q.respuesta_correcta);
      localStorage.setItem('fallos_ultimo_test', JSON.stringify(failed));
    }
  }, [view, questions]);

  // Marcar/desmarcar pregunta difícil
  const toggleMarkQuestion = (q) => {
    setMarkedQuestions(prev => {
      const exists = prev.find(mq => mq.id_pregunta === q.id_pregunta);
      let updated;
      if (exists) {
        updated = prev.filter(mq => mq.id_pregunta !== q.id_pregunta);
      } else {
        updated = [...prev, q];
      }
      localStorage.setItem('preguntas_marcadas', JSON.stringify(updated));
      return updated;
    });
  };

  // Cargar preguntas marcadas al iniciar
  useEffect(() => {
    const marcadas = JSON.parse(localStorage.getItem('preguntas_marcadas') || '[]');
    setMarkedQuestions(marcadas);
  }, []);

  // --- Render principal ---
  return (
    <div className="container-fluid p-0" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="container mt-5" style={{ flex: 1 }}>

        {view === '' && (
          <>
            <h1 className="mb-4">Test AGE</h1>

            <div className="row mb-3 g-2">

              <div className="col-6 col-md-auto">
                <button className="btn btn-outline-dark w-100" onClick={() => setView('personalizado')}>Crear test</button>
              </div>

              <div className="col-6 col-md-auto">
                <button className="btn btn-primary w-100" onClick={() => setView('temario')}>Cargar Temario</button>
              </div>

              <div className="col-6 col-md-auto">
                <button className="btn btn-secondary w-100" onClick={async () => {
                  // Cargar todas las preguntas y barajar
                  const res = await fetch('/api/all-questions');
                  const all = await res.json();
                  setInfiniteQuestions(all.sort(() => Math.random() - 0.5));
                  setInfiniteCurrent(0);
                  setReviewMode('infinito');
                  setView('repaso');
                }}>
                  Modo infinito
                </button>
              </div>

              <div className="col-6 col-md-auto">
                <button className="btn btn-success w-100" onClick={() => setView('crear')}>Crear preguntas</button>
              </div>
              
            </div>
          </>
        )}

        {/* --- Panel de repaso inteligente --- */}
        {view === 'repaso' && (
          <>
            <button className="btn btn-secondary mb-4" onClick={() => setView('')}>Volver</button>
            <h4 className="mb-3">
              {reviewMode === 'infinito' && 'Modo aleatorio continuo'}
            </h4>
            {reviewMode === 'infinito' && infiniteQuestions.length === 0 && (
              <div className="alert alert-info">
                No hay preguntas disponibles para el modo aleatorio continuo.
              </div>
            )}
            {reviewMode === 'infinito' && infiniteQuestions.length > 0 && (
              <TestPanel
                questions={infiniteQuestions}
                current={infiniteCurrent}
                setCurrent={setInfiniteCurrent}
                selectedOption={infiniteSelected}
                setSelectedOption={setInfiniteSelected}
                handleAnswer={handleInfiniteAnswer}
                nextQuestion={() => setInfiniteCurrent(c => (c + 1) % infiniteQuestions.length)}
                correctCount={infiniteCorrect}
                incorrectCount={infiniteIncorrect}
                copiarPreguntaActual={copiarPreguntaActual}
                reiniciarTest={reiniciarInfinito}
                handleSenorGPT={() => {}}
                showTopButtons={true}
                customFontSize={18}
              />
            )}
          </>
        )}

        {/* Vista de cargar test */}
        {view === 'cargar' && (
          <>
            <button className="btn btn-secondary mb-4" onClick={() => setView('')}>
              <span role="img" aria-label="inicio">Volver Volver al inicio</span> 
            </button>
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
            )} {/* <-- Cierra correctamente el bloque de búsqueda aquí */}

            <TestPanel
              questions={questions}
              current={current}
              setCurrent={setCurrent}
              selectedOption={selectedOption}
              setSelectedOption={setSelectedOption}
              handleAnswer={handleAnswer}
              nextQuestion={nextQuestion}
              correctCount={correctCount}
              incorrectCount={incorrectCount}
              copiarPreguntaActual={copiarPreguntaActual}
              reiniciarTest={() => {
                showCustomConfirm(
                  '¿Estás seguro de que quieres reiniciar el test? Se perderán todas las respuestas.',
                  () => {
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
                  }
                );
              }}
              handleSenorGPT={() => {
                let texto = `Pregunta: ${currentQuestion.pregunta}\n`;
                Object.entries(currentQuestion.opciones).forEach(([key, value]) => {
                  texto += `${key.toUpperCase()}: ${value}\n`;
                });
                const url = `https://www.google.com/search?q=${encodeURIComponent('ChatGPT ' + texto)}`;
                window.open(url, '_blank');
              }}
            />
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
          </>
        )}

        {/* Vista crear test */}
        {view === 'crear' && (
          <>
            <button className="btn btn-secondary mb-4" onClick={() => setView('')}>Volver</button>
            {/* Copia del panel de crear test */}
            <div
              style={{
                width: 400,
                margin: '0 auto',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: 24,
                overflowY: 'auto'
              }}
            >
              <h4>Nuevo test</h4>
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
                  <li key={q.id_pregunta || idx} className="list-group-item d-flex justify-content-between align-items-center">
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
                Descargar test en formato JSON
              </button>
            </div>
          </>
        )}

        {/* Vista temario */}
        {view === 'temario' && (
          <>
            <button className="btn btn-secondary mb-4" onClick={() => setView('')}>Volver</button>
            <div
              style={{
                width: 500,
                margin: '0 auto',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                padding: 24,
                overflowY: 'auto'
              }}
            >
              <h4>Temario</h4>
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
          </>
        )}

        {/* Vista test personalizado */}
        {view === 'personalizado' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <button className="btn btn-secondary" onClick={() => setView('')}>
                Volver
              </button>
              {customTestStarted && (
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-warning" 
                    onClick={() => {
                      showCustomConfirm(
                        '¿Estás seguro de que quieres reiniciar el test? Se perderán todas las respuestas.',
                        () => {
                          setCustomTestCorrect(0);
                          setCustomTestIncorrect(0);
                          const resetQuestions = customTestQuestions.map(q => {
                            const { respuesta_usuario, ...rest } = q;
                            return rest;
                          });
                          setCustomTestQuestions(resetQuestions);
                          setCustomTestCurrent(0);
                          setCustomTestSelected(null);
                        }
                      );
                    }}
                  >
                    Reiniciar test
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => {
                      showCustomConfirm(
                        '¿Estás seguro de que quieres crear un nuevo test? Se perderá el progreso actual.',
                        () => {
                          setCustomTestStarted(false);
                          setCustomTestQuestions([]);
                          setCustomTestCurrent(0);
                          setCustomTestSelected(null);
                          setCustomTestCorrect(0);
                          setCustomTestIncorrect(0);
                          setCustomExam('');
                          setCustomTema('');
                          setCustomNumQuestions(10);
                        }
                      );
                    }}
                  >
                    Crear nuevo test
                  </button>
                </div>
              )}
            </div>
            
            <div
              style={{
                width: '100%',
                maxWidth: 800,
                margin: '0 auto',
                background: '#fff',
                // boxShadow solo hasta las opciones, no en el panel entero
                padding: 0,
                overflowY: 'auto'
              }}
            >
              {/* Título con botones alineados a la derecha */}
              <div className="d-flex justify-content-between align-items-center mb-3 px-4 pt-4">
                <h4 className="mb-0">Test personalizado</h4>
                {customTestStarted && (
                  <div className="d-flex gap-2 align-items-center">
                    {/* Iconos para tamaño de texto */}
                    <button
                      className="btn btn-light btn-sm"
                      title="Reducir tamaño de texto"
                      style={{ fontSize: 18, padding: '2px 8px' }}
                      onClick={() => setCustomFontSize(s => Math.max(14, s - 2))}
                    >
                      <span role="img" aria-label="disminuir">A-</span>
                    </button>
                    <button
                      className="btn btn-light btn-sm"
                      title="Aumentar tamaño de texto"
                      style={{ fontSize: 22, padding: '2px 8px' }}
                      onClick={() => setCustomFontSize(s => Math.min(32, s + 2))}
                    >
                      <span role="img" aria-label="aumentar">A+</span>
                    </button>
                    <button 
                      className="btn btn-info btn-sm" 
                      onClick={() => {
                        const currentQuestion = customTestQuestions[customTestCurrent];
                        let texto = `Pregunta: ${currentQuestion.pregunta}\n`;
                        Object.entries(currentQuestion.opciones).forEach(([key, value]) => {
                          texto += `${key.toUpperCase()}: ${value}\n`;
                        });
                        const url = `https://www.google.com/search?q=${encodeURIComponent('ChatGPT ' + texto)}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <span role="img" aria-label="robot">🤖</span>
                    </button>
                    <button 
                      className="btn btn-outline-secondary btn-sm" 
                      onClick={() => copiarPreguntaActual(customTestQuestions[customTestCurrent])}
                    >
                      📋 Copiar
                    </button>
                  </div>
                )}
              </div>
              
              <div
                style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderRadius: 0,
                  margin: 0,
                  padding: 24,
                  paddingTop: 0,
                  paddingBottom: 0,
                  // Responsive font size
                  fontSize: customFontSize,
                  transition: 'font-size 0.2s'
                }}
              >
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
                            onChange={e => {
                              const val = Math.max(1, Math.min(Number(e.target.value), getFilteredCustomQuestions().length));
                              setCustomNumQuestions(val);
                            }}
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
                    <TestPanel
                      questions={customTestQuestions}
                      current={customTestCurrent}
                      setCurrent={setCustomTestCurrent}
                      selectedOption={customTestSelected}
                      setSelectedOption={setCustomTestSelected}
                      handleAnswer={handleCustomTestAnswer}
                      nextQuestion={nextCustomTestQuestion}
                      correctCount={customTestCorrect}
                      incorrectCount={customTestIncorrect}
                      copiarPreguntaActual={copiarPreguntaActual}
                      handleSenorGPT={() => {
                        const currentQuestion = customTestQuestions[customTestCurrent];
                        let texto = `Pregunta: ${currentQuestion.pregunta}\n`;
                        Object.entries(currentQuestion.opciones).forEach(([key, value]) => {
                          texto += `${key.toUpperCase()}: ${value}\n`;
                        });
                        const url = `https://www.google.com/search?q=${encodeURIComponent('ChatGPT ' + texto)}`;
                        window.open(url, '_blank');
                      }}
                      showTopButtons={true}
                      customFontSize={customFontSize}
                    />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Popup de confirmación */}
        {showConfirmDialog && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000
            }}
          >
            <div
              style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                maxWidth: '400px',
                textAlign: 'center'
              }}
            >
              <p style={{ marginBottom: '20px', fontSize: '16px' }}>{confirmMessage}</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleConfirm(true)}
                >
                  Sí, continuar
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleConfirm(false)}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje copiado */}
        {showCopiedMessage && (
          <div
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              background: '#28a745',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '5px',
              zIndex: 9999,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}
          >
            ✅ Pregunta copiada
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-light text-center text-lg-start mt-auto py-3">
        <div className="container">
          <p className="text-muted mb-0">- 2025 Test AGE -</p>
        </div>
      </footer>
    </div>
  );
}

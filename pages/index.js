import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import ErrorBoundary from '../components/ErrorBoundary';
import { QuestionCard, NavigationPanel, TestControls } from '../components/test';
import TokenManager from '../components/TokenManager';

const PANEL_WIDTH = 600;

export default function Home() {
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
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newQuestions, setNewQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newOptions, setNewOptions] = useState({ a: '', b: '', c: '', d: '' });
  const [newCorrect, setNewCorrect] = useState('a');
  const [temarioAuth, setTemarioAuth] = useState(false);
  const [temarioInput, setTemarioInput] = useState('');
  const [temarioError, setTemarioError] = useState('');
  const [temarioUrl, setTemarioUrl] = useState('');
  const [temas, setTemas] = useState([]);
  const [temaSearch, setTemaSearch] = useState('');
  const [newTema, setNewTema] = useState('');
  const [editIndex, setEditIndex] = useState(null);
  const [errorPregunta, setErrorPregunta] = useState('');
  const [showTokenPanel, setShowTokenPanel] = useState(false);
  const [customNumQuestions, setCustomNumQuestions] = useState(10);
  const [customTema, setCustomTema] = useState('');
  const [customExam, setCustomExam] = useState('');
  const [customQuestions, setCustomQuestions] = useState([]);
  const [customTemas, setCustomTemas] = useState([]);
  const [customTemaCounts, setCustomTemaCounts] = useState({});
  const [customExamList, setCustomExamList] = useState([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [navRows, setNavRows] = useState(5);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [showNavPanel, setShowNavPanel] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [reviewMode, setReviewMode] = useState('');
  const [infiniteQuestions, setInfiniteQuestions] = useState([]);
  const [infiniteCurrent, setInfiniteCurrent] = useState(0);
  const [infiniteSelected, setInfiniteSelected] = useState(null);
  const [infiniteCorrect, setInfiniteCorrect] = useState(0);
  const [infiniteIncorrect, setInfiniteIncorrect] = useState(0);
  const [autoNext, setAutoNext] = useState(false);
  const [showTema, setShowTema] = useState(true); // Nuevo estado para mostrar tema
  const [shuffleOptions, setShuffleOptions] = useState(false); // Nuevo estado para mezclar opciones
  const [customTestQuestions, setCustomTestQuestions] = useState([]);
  const [customTestStarted, setCustomTestStarted] = useState(false);
  const [customTestCurrent, setCustomTestCurrent] = useState(0);
  const [customTestSelected, setCustomTestSelected] = useState(null);
  const [customTestCorrect, setCustomTestCorrect] = useState(0);
  const [customTestIncorrect, setCustomTestIncorrect] = useState(0);

  const showCustomConfirm = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmDialog(true);
  };

  const handleConfirm = (confirmed) => {
    setShowConfirmDialog(false);
    if (confirmed && confirmAction) confirmAction();
    setConfirmAction(null);
    setConfirmMessage('');
  };

  useEffect(() => {
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

  const shuffleQuestionOptions = (question) => {
    const opciones = Object.entries(question.opciones);
    const shuffledOpciones = opciones.sort(() => Math.random() - 0.5);
    const newOpciones = {};
    const letters = ['a', 'b', 'c', 'd'];
    let newCorrectAnswer = '';
    
    shuffledOpciones.forEach(([originalKey, value], index) => {
      const newKey = letters[index];
      newOpciones[newKey] = value;
      if (originalKey === question.respuesta_correcta) {
        newCorrectAnswer = newKey;
      }
    });
    
    return {
      ...question,
      opciones: newOpciones,
      respuesta_correcta: newCorrectAnswer,
      opciones_originales: question.opciones,
      respuesta_correcta_original: question.respuesta_correcta
    };
  };

  // Función para obtener pregunta con mezclado dinámico
  const getQuestionWithDynamicShuffle = (question) => {
    if (!question) return null;
    
    // Si ya tiene respuesta del usuario, no mezclar (mantener como está)
    if (question.respuesta_usuario) {
      return question;
    }
    
    // Si shuffleOptions está activado y no tiene opciones_originales, aplicar mezclado
    if (shuffleOptions && !question.opciones_originales) {
      return shuffleQuestionOptions(question);
    }
    
    // Si shuffleOptions está desactivado y tiene opciones_originales, restaurar originales
    if (!shuffleOptions && question.opciones_originales) {
      return {
        ...question,
        opciones: question.opciones_originales,
        respuesta_correcta: question.respuesta_correcta_original
      };
    }
    
    // En cualquier otro caso, devolver la pregunta tal como está
    return question;
  };

  const copiarPreguntaActual = (pregunta) => {
    if (!pregunta) return;
    let texto = '';
    if (showTema && pregunta.tema) {
      texto += `Tema: ${pregunta.tema}\n`;
    }
    texto += `Pregunta: ${pregunta.pregunta}\n`;
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

    // Aplicar mezcla de opciones si está activada
    const processedQuestions = shuffleOptions 
      ? shuffled.map(q => shuffleQuestionOptions(q))
      : shuffled;

    const saved = localStorage.getItem(`respuestas_${filename}`);
    let restored = processedQuestions;

    if (saved) {
      const savedAnswers = JSON.parse(saved);
      restored = processedQuestions.map(q => {
        const match = savedAnswers.find(sq => sq.id_pregunta === q.id_pregunta);
        return match ? { ...q, respuesta_usuario: match.respuesta_usuario } : q;
      });

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
    const preguntas = questions.filter(q => q.pregunta.toLowerCase().includes(lower));
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

  const downloadTest = () => {
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

  useEffect(() => {
    if (showCreatePanel && temas.length === 0) {
      fetch('/temario.txt')
        .then(res => res.text())
        .then(txt => {
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
    if (['a', 'b', 'c', 'd'].some(opt => !newOptions[opt].trim())) {
      setErrorPregunta('Debes rellenar las 4 opciones.');
      return;
    }
    if (editIndex !== null) {
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
        id_pregunta: (i + 1).toString().padStart(2, '0')
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

  const getFilteredCustomQuestions = () => {
    let filtered = customQuestions;
    if (customExam) filtered = filtered.filter(q => q.examen === customExam);
    if (customTema) filtered = filtered.filter(q => q.tema === customTema);
    return filtered;
  };

  const startCustomTest = () => {
    const filtered = getFilteredCustomQuestions();
    let shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, customNumQuestions);
    
    // Aplicar mezcla de opciones si está activada
    if (shuffleOptions) {
      shuffled = shuffled.map(q => shuffleQuestionOptions(q));
    }
    
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

  function TestPanel({ 
    questions, 
    current, 
    setCurrent, 
    selectedOption, 
    setSelectedOption, 
    handleAnswer, 
    nextQuestion, 
    correctCount, 
    incorrectCount, 
    autoNext = false,
    navRows,
    setNavRows
  }) {
    // Aplicar mezclado dinámico a la pregunta actual
    const currentQuestion = getQuestionWithDynamicShuffle(questions[current]);
    const baseFooterHeight = 80;
    const BUTTON_SIZE = 36;
    const GAP_SIZE = 4;
    const totalRows = Math.ceil(questions.length / 8);
    const maxRows = Math.min(15, totalRows);
    const visibleRows = Math.max(1, Math.min(navRows, maxRows));
    const panelHeight = visibleRows * (BUTTON_SIZE + GAP_SIZE);
    const navPanelHeight = showNavPanel ? panelHeight + 32 : 0;
    const dynamicMarginBottom = baseFooterHeight + navPanelHeight + 20;

    const handleQuestionSelect = (index) => {
      setCurrent(index);
      setSelectedOption(questions[index]?.respuesta_usuario || null);
    };

    const handlePrevious = () => {
      const newCurrent = current - 1;
      if (newCurrent >= 0 && newCurrent < questions.length) {
        setCurrent(newCurrent);
        setSelectedOption(questions[newCurrent].respuesta_usuario || null);
      }
    };

    const handleNext = () => {
      const newCurrent = current + 1;
      if (newCurrent >= 0 && newCurrent < questions.length) {
        setCurrent(newCurrent);
        setSelectedOption(questions[newCurrent].respuesta_usuario || null);
      }
    };

    return (
      <>
      {currentQuestion && (
        <div style={{ marginBottom: `${dynamicMarginBottom}px` }}>
          <QuestionCard
            question={currentQuestion}
            questionNumber={current + 1}
            selectedOption={selectedOption}
            onAnswer={handleAnswer}
            showResult={!!selectedOption}
            showTema={showTema} // Pasar la prop showTema
          />
          
          {selectedOption && current < questions.length - 1 && !autoNext && (
            <button className="btn btn-primary mt-3" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={nextQuestion}>
              Siguiente
            </button>
          )}
          
          {selectedOption && current === questions.length - 1 && (
            <p className="mt-3 text-success">¡Has llegado al final del examen!</p>
          )}
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#f8f9fa',
        borderTop: '1px solid #dee2e6', padding: '5px', zIndex: 1000,
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
      }}>
        <div className="container-fluid">
          <TestControls
            correctCount={correctCount}
            incorrectCount={incorrectCount}
            current={current}
            total={questions.length}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onToggleNavPanel={() => setShowNavPanel(!showNavPanel)}
            showNavPanel={showNavPanel}
          />
          <NavigationPanel
            questions={questions}
            current={current}
            onQuestionSelect={handleQuestionSelect}
            navRows={navRows}
            isVisible={showNavPanel}
          />
        </div>
      </div>
      </>
    );
  }

  const handleInfiniteAnswer = (key) => {
    if (infiniteQuestions[infiniteCurrent]?.respuesta_usuario) return;
    setInfiniteSelected(key);
    const updated = [...infiniteQuestions];
    updated[infiniteCurrent] = { ...updated[infiniteCurrent], respuesta_usuario: key };
    setInfiniteQuestions(updated);

    if (key === updated[infiniteCurrent].respuesta_correcta) {
      setInfiniteCorrect(prev => prev + 1);
    } else {
      setInfiniteIncorrect(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (reviewMode === 'infinito' && infiniteQuestions.length > 0) {
      setInfiniteSelected(infiniteQuestions[infiniteCurrent]?.respuesta_usuario || null);
    }
  }, [infiniteCurrent, infiniteQuestions, reviewMode]);

  useEffect(() => {
    if (view === 'cargar' && questions.length > 0) {
      const failed = questions.filter(q => q.respuesta_usuario && q.respuesta_usuario !== q.respuesta_correcta);
      localStorage.setItem('fallos_ultimo_test', JSON.stringify(failed));
    }
  }, [view, questions]);

  const closeAllPanels = () => {
    setShowCreatePanel(false);
    setShowTokenPanel(false);
  }
// --- Render principal ---
return (
    <ErrorBoundary>
      <div className="container-fluid p-0" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="container mt-5" style={{ flex: 1 }}>

        {view === '' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="mb-0">Test AGE</h1>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-dark btn-sm" onClick={() => { closeAllPanels(); setView('personalizado'); }}>
                  Crear test
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => { closeAllPanels(); setView('temario'); }}>
                  Cargar Temario
                </button>
                <button className="btn btn-warning btn-sm" onClick={() => { closeAllPanels(); setShowTokenPanel(true); }}>
                  Admin
                </button>
              </div>
            </div>

            {showTokenPanel && (
              <div className="position-absolute w-100 h-100 bg-light" style={{ zIndex: 1000, overflowY: 'auto', top: 0, left: 0 }}>
                <div className="d-flex justify-content-between align-items-center p-3 bg-white border-bottom">
                  <h4 className="mb-0">🔑 Gestión de Tokens</h4>
                  <button className="btn btn-danger btn-sm" onClick={() => setShowTokenPanel(false)}>✕ Cerrar</button>
                </div>
                <TokenManager />
              </div>
            )}

            {!showTokenPanel && (
              <>
                <div className="mb-4">
                  <div className="alert alert-info" style={{ fontSize: 17 }}>
                    <strong>¿Qué puedes hacer aquí?</strong>
                    <ul className="mb-0 mt-2" style={{ paddingLeft: 22 }}>
                      <li><strong>Crear test:</strong> Elige temas y número de preguntas.</li>
                      <li><strong>Cargar Temario:</strong> Consulta el temario completo.</li>
                      <li><strong>Modo Infinito:</strong> Preguntas sin fin.</li>
                      <li><strong>Crear preguntas:</strong> Añade tus propias preguntas y genera un JSON.</li>
                    </ul>
                  </div>
                </div>

                <div className="row mb-3 g-2">
                  <div className="col-6 col-md-auto">
                    <button className="btn btn-outline-dark w-100" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('personalizado')}>Crear test</button>
                  </div>
                  <div className="col-6 col-md-auto">
                    <button className="btn btn-primary w-100" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('temario')}>Cargar Temario</button>
                  </div>
                  <div className="col-6 col-md-auto">
                    <button className="btn btn-secondary w-100" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={async () => {
                      const res = await fetch('/api/all-questions');
                      const all = await res.json();
                      // Aplicar mezcla condicionalmente basado en el checkbox
                      const questionsWithShuffledOptions = shuffleOptions 
                        ? all.map(shuffleQuestionOptions)
                        : all;
                      setInfiniteQuestions(questionsWithShuffledOptions.sort(() => Math.random() - 0.5));
                      setInfiniteCurrent(0);
                      setReviewMode('infinito');
                      setView('repaso');
                    }}>
                      Modo Infinito
                    </button>
                  </div>
                  <div className="col-6 col-md-auto">
                    <button className="btn btn-success w-100" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('crear')}>Crear preguntas</button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Panel de repaso */}
        {view === 'repaso' && !showTokenPanel && (
          <>
            <button className="btn btn-secondary mb-4" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('')}>Volver</button>
            <h4 className="mb-3">Modo Infinito</h4>
            {infiniteQuestions.length === 0 ? (
              <div className="alert alert-info">No hay preguntas disponibles para el modo Infinito.</div>
            ) : (
              <div style={{ width: '100%', margin: '0 auto' }}>
                <div className="d-flex gap-3 align-items-center justify-content-between mb-3 flex-wrap">
                  <div className="d-flex gap-3 align-items-center">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="autoNextCheck" checked={autoNext} onChange={e => setAutoNext(e.target.checked)} />
                      <label className="form-check-label" htmlFor="autoNextCheck">Auto-continuar</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="showTemaCheck" checked={showTema} onChange={e => setShowTema(e.target.checked)} />
                      <label className="form-check-label" htmlFor="showTemaCheck">Mostrar tema</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="shuffleOptionsCheck" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} />
                      <label className="form-check-label" htmlFor="shuffleOptionsCheck">Mezclar opciones</label>
                    </div>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <button className="btn btn-info btn-sm" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                      onClick={() => {
                        const currentQuestion = infiniteQuestions[infiniteCurrent];
                        let texto = '';
                        if (showTema && currentQuestion.tema) {
                          texto += `Tema: ${currentQuestion.tema}\n`;
                        }
                        texto += `Pregunta: ${currentQuestion.pregunta}\n`;
                        Object.entries(currentQuestion.opciones).forEach(([key, value]) => {
                          texto += `${key.toUpperCase()}: ${value}\n`;
                        });
                        const url = `https://www.google.com/search?q=${encodeURIComponent('ChatGPT ' + texto)}`;
                        window.open(url, '_blank');
                      }}>🤖</button>
                    <button className="btn btn-outline-secondary btn-sm" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => copiarPreguntaActual(infiniteQuestions[infiniteCurrent])}>📋</button>
                  </div>
                </div>
                <TestPanel
                  questions={infiniteQuestions}
                  current={infiniteCurrent}
                  setCurrent={setInfiniteCurrent}
                  selectedOption={infiniteSelected}
                  setSelectedOption={setInfiniteSelected}
                  handleAnswer={(key) => {
                    handleInfiniteAnswer(key);
                    if (autoNext) {
                      setTimeout(() => {
                        setInfiniteCurrent(c => (c + 1) % infiniteQuestions.length);
                        setInfiniteSelected(null);
                      }, 1000);
                    }
                  }}
                  nextQuestion={() => setInfiniteCurrent(c => (c + 1) % infiniteQuestions.length)}
                  correctCount={infiniteCorrect}
                  incorrectCount={infiniteIncorrect}
                  navRows={navRows}
                  setNavRows={setNavRows}
                />
              </div>
            )}
          </>
        )}

        {/* Vista cargar test */}
        {view === 'cargar' && !showTokenPanel && (
          <>
            <button className="btn btn-secondary mb-4" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('')}>Volver al inicio</button>
            <h1 className="mb-4">Test AGE</h1>
            <div className="mb-3">
              <label className="form-label">Selecciona un examen:</label>
              <select className="form-select" onChange={handleSelect} value={selectedExam}>
                <option value="">-- Selecciona --</option>
                {examFiles.map((file, idx) => <option key={idx} value={file}>{file}</option>)}
              </select>
            </div>

            {questions.length > 0 && (
              <div className="d-flex gap-3 align-items-center justify-content-center mb-3 flex-wrap">
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="autoNextCheckCargar" checked={autoNext} onChange={e => setAutoNext(e.target.checked)} />
                  <label className="form-check-label" htmlFor="autoNextCheckCargar">Auto-continuar</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="showTemaCheckCargar" checked={showTema} onChange={e => setShowTema(e.target.checked)} />
                  <label className="form-check-label" htmlFor="showTemaCheckCargar">Mostrar tema</label>
                </div>
                <div className="form-check">
                  <input className="form-check-input" type="checkbox" id="shuffleOptionsCheckCargar" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} />
                  <label className="form-check-label" htmlFor="shuffleOptionsCheckCargar">Mezclar opciones</label>
                </div>
              </div>
            )}

            <div className="mb-3">
              <input type="text" className="form-control" placeholder="Buscar en preguntas o respuestas..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            
            {search && (
              <div className="mb-4">
                <h5>Preguntas encontradas</h5>
                {searchResults.preguntas.length === 0 ? <p>No hay coincidencias.</p> : (
                  <ul>
                    {searchResults.preguntas.map((q, idx) => (
                      <li key={q.id_pregunta || idx}>
                        <button className="btn btn-link p-0" onClick={() => {
                          const i = questions.findIndex(qq => qq.id_pregunta === q.id_pregunta);
                          if (i !== -1) {
                            setCurrent(i);
                            setSelectedOption(questions[i].respuesta_usuario || null);
                          }
                        }}>{q.pregunta}</button>
                      </li>
                    ))}
                  </ul>
                )}
                <h5>Respuestas encontradas</h5>
                {searchResults.respuestas.length === 0 ? <p>No hay coincidencias.</p> : (
                  <ul>
                    {searchResults.respuestas.map((r, idx) => (
                      <li key={idx}>
                        <button className="btn btn-link p-0" onClick={() => {
                          setCurrent(r.index);
                          setSelectedOption(questions[r.index].respuesta_usuario || null);
                        }}>
                          Pregunta: {r.pregunta} <br />
                          <strong>{r.opcion.toUpperCase()}:</strong> {r.texto}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {questions.length > 0 && (
              <div style={{ width: PANEL_WIDTH, margin: '0 auto' }}>
                <TestPanel
                  questions={questions}
                  current={current}
                  setCurrent={setCurrent}
                  selectedOption={selectedOption}
                  setSelectedOption={setSelectedOption}
                  handleAnswer={(key) => {
                    handleAnswer(key);
                    if (autoNext && current < questions.length - 1) {
                      setTimeout(() => {
                        setCurrent(c => c + 1);
                        setSelectedOption(questions[current + 1]?.respuesta_usuario || null);
                      }, 1000);
                    }
                  }}
                  nextQuestion={nextQuestion}
                  correctCount={correctCount}
                  incorrectCount={incorrectCount}
                  autoNext={autoNext}
                  navRows={navRows}
                  setNavRows={setNavRows}
                />
              </div>
            )}
          </>
        )}

        {/* Vista crear test */}
        {view === 'crear' && !showTokenPanel && (
          <>
            <button className="btn btn-secondary mb-4" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('')}>Volver</button>
            <div style={{ width: 400, margin: '0 auto', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 24, overflowY: 'auto' }}>
              <h4>Nuevo test</h4>
              <div className="mb-3">
                <label className="form-label">Título del test</label>
                <input className="form-control" value={newTestTitle} onChange={e => setNewTestTitle(e.target.value)} />
              </div>
              <hr />
              <h5>{editIndex !== null ? 'Editar pregunta' : 'Añadir pregunta'}</h5>
              <div className="mb-2">
                <input className="form-control mb-2" placeholder="Texto de la pregunta" value={newQuestionText} onChange={e => setNewQuestionText(e.target.value)} />
                <input className="form-control mb-2" placeholder="Buscar tema..." value={temaSearch} onChange={e => setTemaSearch(e.target.value)} />
                <select className="form-select mb-2" value={newTema} onChange={e => setNewTema(e.target.value)}>
                  <option value="">-- Selecciona tema --</option>
                  {temas.filter(t => t.toLowerCase().includes(temaSearch.toLowerCase())).map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                  ))}
                </select>
                {['a', 'b', 'c', 'd'].map(opt => (
                  <div className="input-group mb-2" key={opt}>
                    <span className="input-group-text">{opt.toUpperCase()}</span>
                    <input className="form-control" placeholder={`Opción ${opt.toUpperCase()}`} value={newOptions[opt]} onChange={e => setNewOptions({ ...newOptions, [opt]: e.target.value })} />
                    <span className="input-group-text">
                      <input type="radio" name="correct" checked={newCorrect === opt} onChange={() => setNewCorrect(opt)} />
                      Correcta
                    </span>
                  </div>
                ))}
                {errorPregunta && <div className="text-danger mb-2">{errorPregunta}</div>}
                <button className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={addOrEditQuestion}>
                  {editIndex !== null ? 'Guardar cambios' : 'Añadir pregunta'}
                </button>
                {editIndex !== null && (
                  <button className="btn btn-secondary ms-2" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => {
                    setEditIndex(null);
                    setNewQuestionText('');
                    setNewOptions({ a: '', b: '', c: '', d: '' });
                    setNewCorrect('a');
                    setNewTema('');
                    setErrorPregunta('');
                  }}>Cancelar</button>
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
                      <button className="btn btn-sm btn-outline-primary me-1" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => handleEdit(idx)}>Editar</button>
                      <button className="btn btn-sm btn-outline-danger" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => handleDelete(idx)}>Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
              <button className="btn btn-success mt-3" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={downloadTest} disabled={!newTestTitle || newQuestions.length === 0}>
                Descargar test en formato JSON
              </button>
            </div>
          </>
        )}

        {/* Vista temario */}
        {view === 'temario' && !showTokenPanel && (
          <>
            <button className="btn btn-secondary mb-4" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('')}>Volver</button>
            <div style={{ width: '100%', margin: '0 auto', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', padding: 24, overflowY: 'auto' }}>
              <h4>Temario</h4>
              {!temarioAuth ? (
                <div className="mt-4">
                  <p>Introduce la contraseña para acceder al temario:</p>
                  <input type="password" className="form-control mb-2" value={temarioInput} onChange={e => setTemarioInput(e.target.value)} />
                  {temarioError && <div className="text-danger mb-2">{temarioError}</div>}
                  <button className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={handleTemarioLogin}>Acceder</button>
                </div>
              ) : (
                <div className="mt-4 text-center">
                  <p>El temario se encuentra en Notion.<br />
                    <a href={temarioUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}>
                      Abrir Temario en Notion
                    </a>
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Vista test personalizado */}
        {view === 'personalizado' && !showTokenPanel && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <button className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('')}>Volver</button>
              {customTestStarted && (
                <div className="d-flex gap-2">
                  <button className="btn btn-warning btn-sm" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
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
                    }}>Reiniciar test</button>
                  <button className="btn btn-primary btn-sm" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
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
                    }}>Crear nuevo test</button>
                </div>
              )}
            </div>
            
            <h4 className="mb-3">Test personalizado</h4>
            
            {!customTestStarted ? (
              <div style={{ width: '100%', margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 0, padding: 24, transition: 'font-size 0.2s' }}>
                {customLoading ? (
                  <div className="my-4 text-center">
                    <div className="spinner-border" />
                    <div>Cargando preguntas...</div>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Examen</label>
                      <select className="form-select" value={customExam} onChange={e => setCustomExam(e.target.value)}>
                        <option value="">-- Todos --</option>
                        {customExamList.map((ex, i) => <option key={i} value={ex}>{ex}</option>)}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Tema</label>
                      <select className="form-select" value={customTema} onChange={e => setCustomTema(e.target.value)}>
                        <option value="">-- Todos --</option>
                        {customTemas.map((t, i) => (
                          <option key={i} value={t}>{t} ({customTemaCounts[t] || 0} preguntas)</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Número de preguntas</label>
                      <div className="form-check mb-2">
                        <input className="form-check-input" type="checkbox" id="allQuestionsCheck"
                          checked={customNumQuestions === getFilteredCustomQuestions().length}
                          onChange={e => {
                            if (e.target.checked) {
                              setCustomNumQuestions(getFilteredCustomQuestions().length);
                            } else {
                              setCustomNumQuestions(10);
                            }
                          }} />
                        <label className="form-check-label" htmlFor="allQuestionsCheck">Todas las preguntas disponibles</label>
                      </div>
                      <input type="number" className="form-control" min={1} max={Math.max(1, getFilteredCustomQuestions().length)} value={customNumQuestions}
                        disabled={customNumQuestions === getFilteredCustomQuestions().length}
                        onChange={e => {
                          const val = Math.max(1, Math.min(Number(e.target.value), getFilteredCustomQuestions().length));
                          setCustomNumQuestions(val);
                        }} />
                      <small className="text-muted">Hay {getFilteredCustomQuestions().length} preguntas disponibles con estos filtros.</small>
                    </div>
                    <button className="btn btn-success" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} disabled={getFilteredCustomQuestions().length === 0} onClick={startCustomTest}>
                      Comenzar test
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div style={{ width: '100%', margin: '0 auto' }}>
                <div className="d-flex gap-2 align-items-center justify-content-between mb-3 flex-wrap">
                  <div className="d-flex gap-2 align-items-center">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="autoNextCheckCustom" checked={autoNext} onChange={e => setAutoNext(e.target.checked)} />
                      <label className="form-check-label" htmlFor="autoNextCheckCustom">Auto-continuar</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="showTemaCheckCustom" checked={showTema} onChange={e => setShowTema(e.target.checked)} />
                      <label className="form-check-label" htmlFor="showTemaCheckCustom">Mostrar tema</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="shuffleOptionsCheckCustom" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} />
                      <label className="form-check-label" htmlFor="shuffleOptionsCheckCustom">Mezclar opciones</label>
                    </div>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <button className="btn btn-info btn-sm" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                      onClick={() => {
                        const currentQuestion = customTestQuestions[customTestCurrent];
                        let texto = '';
                        if (showTema && currentQuestion.tema) {
                          texto += `Tema: ${currentQuestion.tema}\n`;
                        }
                        texto += `Pregunta: ${currentQuestion.pregunta}\n`;
                        Object.entries(currentQuestion.opciones).forEach(([key, value]) => {
                          texto += `${key.toUpperCase()}: ${value}\n`;
                        });
                        const url = `https://www.google.com/search?q=${encodeURIComponent('ChatGPT ' + texto)}`;
                        window.open(url, '_blank');
                      }}>🤖</button>
                    <button className="btn btn-outline-secondary btn-sm" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => copiarPreguntaActual(customTestQuestions[customTestCurrent])}>📋</button>
                  </div>
                </div>
                
                <TestPanel
                  questions={customTestQuestions}
                  current={customTestCurrent}
                  setCurrent={setCustomTestCurrent}
                  selectedOption={customTestSelected}
                  setSelectedOption={setCustomTestSelected}
                  handleAnswer={(key) => {
                    handleCustomTestAnswer(key);
                    if (autoNext && customTestCurrent < customTestQuestions.length - 1) {
                      setTimeout(() => {
                        setCustomTestCurrent(c => c + 1);
                        setCustomTestSelected(null);
                      }, 1000);
                    }
                  }}
                  nextQuestion={nextCustomTestQuestion}
                  correctCount={customTestCorrect}
                  incorrectCount={customTestIncorrect}
                  navRows={navRows}
                  setNavRows={setNavRows}
                />
              </div>
            )}
          </>
        )}

        {/* Popup de confirmación */}
        {showConfirmDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', maxWidth: '400px', textAlign: 'center' }}>
              <p style={{ marginBottom: '20px', fontSize: '16px' }}>{confirmMessage}</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="btn btn-danger" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => handleConfirm(true)}>Sí, continuar</button>
                <button className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => handleConfirm(false)}>Cancelar</button>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje copiado */}
        {showCopiedMessage && (
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(40, 167, 69, 0.65)', color: 'white', padding: '12px 20px', borderRadius: '8px', zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: '16px', fontWeight: '500', whiteSpace: 'nowrap', backdropFilter: 'blur(4px)' }}>
          ¡Copiado!
          </div>
        )}
      </div>

      <footer className="bg-light text-center text-lg-start mt-auto py-3">
        <div className="container">
          <p className="text-muted mb-0">- 2025 Test AGE -</p>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}
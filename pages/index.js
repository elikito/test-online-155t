import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import ErrorBoundary from '../components/ErrorBoundary';
import { QuestionCard, NavigationPanel, TestControls } from '../components/test';
import TokenManager from '../components/TokenManager';
import StorageService from '../services/storageService';

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

  // Añadir estados para el buscador (cambiar nombres para evitar conflictos)
  const [searchQuery, setSearchQuery] = useState('');
  const [questionSearchResults, setQuestionSearchResults] = useState([]);
  const [showQuestionSearchResults, setShowQuestionSearchResults] = useState(false);

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

  // Cargar estadísticas al inicializar la aplicación
  useEffect(() => {
    const customStats = StorageService.loadStats('custom_test');
    setCustomTestCorrect(customStats.correct);
    setCustomTestIncorrect(customStats.incorrect);
    
    const infiniteStats = StorageService.loadStats('infinite');
    setInfiniteCorrect(infiniteStats.correct);
    setInfiniteIncorrect(infiniteStats.incorrect);
  }, []);

  // Guardar estadísticas de test personalizado cuando cambien
  useEffect(() => {
    StorageService.saveStats('custom_test', {
      correct: customTestCorrect,
      incorrect: customTestIncorrect
    });
  }, [customTestCorrect, customTestIncorrect]);

  // Guardar estadísticas de modo infinito cuando cambien
  useEffect(() => {
    StorageService.saveStats('infinite', {
      correct: infiniteCorrect,
      incorrect: infiniteIncorrect
    });
  }, [infiniteCorrect, infiniteIncorrect]);

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

  // Corregir el useEffect para cargar preguntas personalizadas
  useEffect(() => {
    if (view === 'test') {
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
        })
        .catch(err => {
          console.error('Error loading questions:', err);
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

  // Función para buscar preguntas
  const searchQuestions = (query, questionsArray) => {
    if (!query.trim()) {
      setQuestionSearchResults([]);
      setShowQuestionSearchResults(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = questionsArray
      .map((question, index) => ({ ...question, originalIndex: index }))
      .filter(question => 
        question.pregunta.toLowerCase().includes(lowerQuery) ||
        Object.values(question.opciones).some(opcion => 
          opcion.toLowerCase().includes(lowerQuery)
        ) ||
        (question.tema && question.tema.toLowerCase().includes(lowerQuery))
      );

    setQuestionSearchResults(results);
    setShowQuestionSearchResults(true);
  };

  // useEffect para la búsqueda
  useEffect(() => {
    let questionsToSearch = [];
    
    if (view === 'test' && customTestStarted) {
      questionsToSearch = customTestQuestions;
    } else if (view === 'infinito') {
      questionsToSearch = infiniteQuestions;
    }
    
    if (questionsToSearch.length > 0) {
      searchQuestions(searchQuery, questionsToSearch);
    } else {
      setQuestionSearchResults([]);
      setShowQuestionSearchResults(false);
    }
  }, [searchQuery, customTestQuestions, infiniteQuestions, view, customTestStarted]);

  // Función para ir a una pregunta específica desde los resultados
  const goToQuestion = (questionIndex) => {
    if (view === 'test' && customTestStarted) {
      setCustomTestCurrent(questionIndex);
      setCustomTestSelected(customTestQuestions[questionIndex]?.respuesta_usuario || null);
    } else if (view === 'infinito') {
      setInfiniteCurrent(questionIndex);
      setInfiniteSelected(infiniteQuestions[questionIndex]?.respuesta_usuario || null);
    }
    setShowQuestionSearchResults(false);
    setSearchQuery('');
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
            showTema={showTema}
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
                <button className="btn btn-warning btn-sm" onClick={() => { closeAllPanels(); setShowTokenPanel(true); }}>
                  Admin
                </button>
              </div>
            </div>

            {showTokenPanel && (
              <div className="position-absolute w-100 h-100 bg-light" style={{ zIndex: 1000, overflowY: 'auto', top: 0, left: 0 }}>
                <div className="d-flex justify-content-between align-items-center p-3 bg-white border-bottom">
                  <h4 className="mb-0">Panel de administración</h4>
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
                    <button className="btn btn-outline-dark w-100" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('test')}>Crear test</button>
                  </div>
                  <div className="col-6 col-md-auto">
                    <button className="btn btn-primary w-100" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('temario')}>Cargar Temario</button>
                  </div>
                  <div className="col-6 col-md-auto">
                    <button className="btn btn-secondary w-100" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={async () => {
                      try {
                        const res = await fetch('/api/all-questions');
                        const all = await res.json();
                        const questionsWithShuffledOptions = shuffleOptions 
                          ? all.map(shuffleQuestionOptions)
                          : all;
                        setInfiniteQuestions(questionsWithShuffledOptions.sort(() => Math.random() - 0.5));
                        setInfiniteCurrent(0);
                        setInfiniteSelected(null);
                        setInfiniteCorrect(0);
                        setInfiniteIncorrect(0);
                        setReviewMode('infinito');
                        setView('infinito');
                      } catch (error) {
                        console.error('Error loading infinite questions:', error);
                      }
                    }}>
                      Modo Infinito
                    </button>
                  </div>
<div className="col-6 col-md-auto">
                    <button className="btn btn-success w-100" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('crear')}>Crear preguntas</button>
                  </div>
                </div>

                {/* Mostrar estadísticas persistentes */}
                <div className="mt-4">
                  <div className="alert alert-secondary" style={{ fontSize: 15 }}>
                    <h6 className="mb-2">📊 Estadísticas Guardadas</h6>
                    <div className="row text-center">
                      <div className="col-6">
                        <div className="border rounded p-2 mb-2">
                          <div><strong>Test Personalizado</strong></div>
                          <div className="text-success">✓ {customTestCorrect} correctas</div>
                          <div className="text-danger">✗ {customTestIncorrect} incorrectas</div>
                          <div className="text-muted small">Total: {customTestCorrect + customTestIncorrect}</div>
                        </div>
                        <button 
                          className="btn btn-outline-warning btn-sm w-100" 
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => {
                            showCustomConfirm(
                              '¿Estás seguro de que quieres resetear las estadísticas del test personalizado?',
                              () => {
                                setCustomTestCorrect(0);
                                setCustomTestIncorrect(0);
                                StorageService.resetStats('custom_test');
                              }
                            );
                          }}
                        >
                          Resetear
                        </button>
                      </div>
                      <div className="col-6">
                        <div className="border rounded p-2 mb-2">
                          <div><strong>Modo Infinito</strong></div>
                          <div className="text-success">✓ {infiniteCorrect} correctas</div>
                          <div className="text-danger">✗ {infiniteIncorrect} incorrectas</div>
                          <div className="text-muted small">Total: {infiniteCorrect + infiniteIncorrect}</div>
                        </div>
                        <button 
                          className="btn btn-outline-warning btn-sm w-100" 
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => {
                            showCustomConfirm(
                              '¿Estás seguro de que quieres resetear las estadísticas del modo infinito?',
                              () => {
                                setInfiniteCorrect(0);
                                setInfiniteIncorrect(0);
                                StorageService.resetStats('infinite');
                              }
                            );
                          }}
                        >
                          Resetear
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* Vista test personalizado y cargar archivo */}
        {view === 'test' && !showTokenPanel && (
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
                          setSelectedExam('');
                          setQuestions([]);
                          setCurrent(0);
                          setCorrectCount(0);
                          setIncorrectCount(0);
                        }
                      );
                    }}>Crear nuevo test</button>
                </div>
              )}
            </div>
            
            <h4 className="mb-3">Crear Test</h4>
            
            {!customTestStarted ? (
              <div style={{ width: '100%', margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: 0, padding: 24 }}>
                {/* Pestañas para alternar entre modos */}
                <div className="mb-4">
                  <div className="btn-group w-100" role="group">
                    <input type="radio" className="btn-check" name="testMode" id="modeCustom" checked={!selectedExam} onChange={() => setSelectedExam('')} />
                    <label className="btn btn-outline-primary" htmlFor="modeCustom">Test Personalizado</label>
                    
                    <input type="radio" className="btn-check" name="testMode" id="modeFile" checked={!!selectedExam} onChange={() => {
                      setCustomExam('');
                      setCustomTema('');
                      setCustomNumQuestions(10);
                    }} />
                    <label className="btn btn-outline-primary" htmlFor="modeFile">Cargar Archivo</label>
                  </div>
                </div>

                {/* Modo cargar archivo */}
                {selectedExam && (
                  <div className="mb-3">
                    <label className="form-label">Selecciona un examen:</label>
                    <select className="form-select" onChange={handleSelect} value={selectedExam}>
                      <option value="">-- Selecciona --</option>
                      {examFiles.map((file, idx) => <option key={idx} value={file}>{file}</option>)}
                    </select>
                    {questions.length > 0 && (
                      <div className="mt-3">
                        <p className="text-success">✓ Examen cargado: {questions.length} preguntas</p>
                        <button className="btn btn-success" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} 
                          onClick={() => {
                            setCustomTestQuestions(questions);
                            setCustomTestStarted(true);
                            setCustomTestCurrent(current);
                            setCustomTestSelected(selectedOption);
                            setCustomTestCorrect(correctCount);
                            setCustomTestIncorrect(incorrectCount);
                          }}>
                          Comenzar con este examen
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Modo test personalizado */}
                {!selectedExam && (
                  <>
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
                        <button className="btn btn-success" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} 
                          disabled={getFilteredCustomQuestions().length === 0} onClick={startCustomTest}>
                          Comenzar test
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* Si hay preguntas cargadas desde archivo */}
                {selectedExam && questions.length > 0 && (
                  <button className="btn btn-success" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} 
                    onClick={() => {
                      setCustomTestQuestions(questions);
                      setCustomTestStarted(true);
                      setCustomTestCurrent(current);
                      setCustomTestSelected(selectedOption);
                      setCustomTestCorrect(correctCount);
                      setCustomTestIncorrect(incorrectCount);
                    }}>
                    Continuar con este examen
                  </button>
                )}
              </div>
            ) : (
              <div style={{ width: '100%', margin: '0 auto' }}>
                <div className="d-flex gap-2 align-items-center justify-content-between mb-3 flex-wrap">
                  <div className="d-flex gap-2 align-items-center">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="autoNextCheckTest" checked={autoNext} onChange={e => setAutoNext(e.target.checked)} />
                      <label className="form-check-label" htmlFor="autoNextCheckTest">Auto-continuar</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="showTemaCheckTest" checked={showTema} onChange={e => setShowTema(e.target.checked)} />
                      <label className="form-check-label" htmlFor="showTemaCheckTest">Tema</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="shuffleOptionsCheckTest" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} />
                      <label className="form-check-label" htmlFor="shuffleOptionsCheckTest">Mezclar</label>
                    </div>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    {/* Buscador */}
                    <div className="position-relative flex-grow-1">
                      <input
                        type="text"
                        className="form-control form-control-sm w-100"
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ 
                          fontSize: '0.875rem'
                        }}
                      />
                      {searchQuery && (
                        <button
                          className="btn btn-sm position-absolute"
                          style={{
                            right: '2px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            border: 'none',
                            background: 'transparent',
                            padding: '0',
                            width: '20px',
                            height: '20px',
                            fontSize: '12px'
                          }}
                          onClick={() => {
                            setSearchQuery('');
                            setShowQuestionSearchResults(false);
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <button className="btn btn-info btn-sm flex-shrink-0" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
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
                    <button className="btn btn-outline-secondary btn-sm flex-shrink-0" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} 
                      onClick={() => copiarPreguntaActual(customTestQuestions[customTestCurrent])}>📋</button>
                  </div>
                </div>

                {/* Área de búsqueda y resultados - AQUÍ */}
                {showQuestionSearchResults && questionSearchResults.length > 0 && (
                  <div className="mb-4" style={{ 
                    background: '#f8f9fa', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '8px', 
                    padding: '16px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Resultados de búsqueda ({questionSearchResults.length})</h6>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setShowQuestionSearchResults(false);
                          setSearchQuery('');
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    {questionSearchResults.map((result, index) => (
                      <div 
                        key={index}
                        className="mb-2 p-2"
                        style={{ 
                          background: '#fff', 
                          border: '1px solid #e9ecef', 
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                        onClick={() => goToQuestion(result.originalIndex)}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div style={{ flex: 1 }}>
                            {showTema && result.tema && (
                              <small className="text-muted d-block mb-1">
                                <strong>Tema:</strong> {result.tema}
                              </small>
                            )}
                            <div style={{ fontSize: '0.9rem' }}>
                              <strong>P{result.originalIndex + 1}:</strong> {result.pregunta.length > 100 ? result.pregunta.substring(0, 100) + '...' : result.pregunta}
                            </div>
                            {result.respuesta_usuario && (
                              <small className={`mt-1 d-block ${result.respuesta_usuario === result.respuesta_correcta ? 'text-success' : 'text-danger'}`}>
                                ✓ {result.respuesta_usuario === result.respuesta_correcta ? 'Correcta' : 'Incorrecta'}
                              </small>
                            )}
                          </div>
                          <small className="text-muted ms-2">
                            Ir →
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
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

        {/* Vista modo infinito */}
        {view === 'infinito' && !showTokenPanel && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
              <button className="btn btn-secondary" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('')}>Volver</button>
              <div className="d-flex gap-2">
                <button className="btn btn-warning btn-sm" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
                  onClick={() => {
                    showCustomConfirm(
                      '¿Quieres mezclar las preguntas de nuevo?',
                      async () => {
                        try {
                          const res = await fetch('/api/all-questions');
                          const all = await res.json();
                          const questionsWithShuffledOptions = shuffleOptions 
                            ? all.map(shuffleQuestionOptions)
                            : all;
                          setInfiniteQuestions(questionsWithShuffledOptions.sort(() => Math.random() - 0.5));
                          setInfiniteCurrent(0);
                          setInfiniteSelected(null);
                          setInfiniteCorrect(0);
                          setInfiniteIncorrect(0);
                        } catch (error) {
                          console.error('Error loading questions:', error);
                        }
                      }
                    );
                  }}>Mezclar</button>
              </div>
            </div>
            
            <h4 className="mb-3">Modo Infinito</h4>
            
            {infiniteQuestions.length === 0 ? (
              <div className="text-center my-4">
                <div className="spinner-border" />
                <div>Cargando preguntas...</div>
              </div>
            ) : (
              <div style={{ width: '100%', margin: '0 auto' }}>
                <div className="d-flex gap-2 align-items-center justify-content-between mb-3 flex-wrap">
                  <div className="d-flex gap-2 align-items-center">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="autoNextCheckInfinite" checked={autoNext} onChange={e => setAutoNext(e.target.checked)} />
                      <label className="form-check-label" htmlFor="autoNextCheckInfinite">Auto-continuar</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="showTemaCheckInfinite" checked={showTema} onChange={e => setShowTema(e.target.checked)} />
                      <label className="form-check-label" htmlFor="showTemaCheckInfinite">Tema</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="shuffleOptionsCheckInfinite" checked={shuffleOptions} onChange={e => setShuffleOptions(e.target.checked)} />
                      <label className="form-check-label" htmlFor="shuffleOptionsCheckInfinite">Mezclar</label>
                    </div>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    {/* Buscador */}
                    <div className="position-relative flex-grow-1">
                      <input
                        type="text"
                        className="form-control form-control-sm w-100"
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ 
                          fontSize: '0.875rem'
                        }}
                      />
                      {searchQuery && (
                        <button
                          className="btn btn-sm position-absolute"
                          style={{
                            right: '2px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            border: 'none',
                            background: 'transparent',
                            padding: '0',
                            width: '20px',
                            height: '20px',
                            fontSize: '12px'
                          }}
                          onClick={() => {
                            setSearchQuery('');
                            setShowQuestionSearchResults(false);
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <button className="btn btn-info btn-sm flex-shrink-0" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
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
                    <button className="btn btn-outline-secondary btn-sm flex-shrink-0" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} 
                      onClick={() => copiarPreguntaActual(infiniteQuestions[infiniteCurrent])}>📋</button>
                  </div>
                </div>

                {/* Área de búsqueda y resultados - AQUÍ TAMBIÉN */}
                {showQuestionSearchResults && questionSearchResults.length > 0 && (
                  <div className="mb-4" style={{ 
                    background: '#f8f9fa', 
                    border: '1px solid #dee2e6', 
                    borderRadius: '8px', 
                    padding: '16px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="mb-0">Resultados de búsqueda ({questionSearchResults.length})</h6>
                      <button 
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => {
                          setShowQuestionSearchResults(false);
                          setSearchQuery('');
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    {questionSearchResults.map((result, index) => (
                      <div 
                        key={index}
                        className="mb-2 p-2"
                        style={{ 
                          background: '#fff', 
                          border: '1px solid #e9ecef', 
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                        onClick={() => goToQuestion(result.originalIndex)}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div style={{ flex: 1 }}>
                            {showTema && result.tema && (
                              <small className="text-muted d-block mb-1">
                                <strong>Tema:</strong> {result.tema}
                              </small>
                            )}
                            <div style={{ fontSize: '0.9rem' }}>
                              <strong>P{result.originalIndex + 1}:</strong> {result.pregunta.length > 100 ? result.pregunta.substring(0, 100) + '...' : result.pregunta}
                            </div>
                            {result.respuesta_usuario && (
                              <small className={`mt-1 d-block ${result.respuesta_usuario === result.respuesta_correcta ? 'text-success' : 'text-danger'}`}>
                                ✓ {result.respuesta_usuario === result.respuesta_correcta ? 'Correcta' : 'Incorrecta'}
                              </small>
                            )}
                          </div>
                          <small className="text-muted ms-2">
                            Ir →
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <TestPanel
                  questions={infiniteQuestions}
                  current={infiniteCurrent}
                  setCurrent={(newCurrent) => {
                    // Modo infinito: si llega al final, vuelve al principio
                    if (newCurrent >= infiniteQuestions.length) {
                      setInfiniteCurrent(0);
                      setInfiniteSelected(infiniteQuestions[0]?.respuesta_usuario || null);
                    } else if (newCurrent < 0) {
                      setInfiniteCurrent(infiniteQuestions.length - 1);
                      setInfiniteSelected(infiniteQuestions[infiniteQuestions.length - 1]?.respuesta_usuario || null);
                    } else {
                      setInfiniteCurrent(newCurrent);
                      setInfiniteSelected(infiniteQuestions[newCurrent]?.respuesta_usuario || null);
                    }
                  }}
                  selectedOption={infiniteSelected}
                  setSelectedOption={setInfiniteSelected}
                  handleAnswer={(key) => {
                    handleInfiniteAnswer(key);
                    if (autoNext) {
                      setTimeout(() => {
                        const nextIndex = infiniteCurrent + 1;
                        if (nextIndex >= infiniteQuestions.length) {
                          setInfiniteCurrent(0);
                          setInfiniteSelected(null);
                        } else {
                          setInfiniteCurrent(nextIndex);
                          setInfiniteSelected(null);
                        }
                      }, 1000);
                    }
                  }}
                  nextQuestion={() => {
                    const nextIndex = infiniteCurrent + 1;
                    if (nextIndex >= infiniteQuestions.length) {
                      setInfiniteCurrent(0);
                    } else {
                      setInfiniteCurrent(nextIndex);
                    }
                    setInfiniteSelected(null);
                  }}
                  correctCount={infiniteCorrect}
                  incorrectCount={infiniteIncorrect}
                  navRows={navRows}
                  setNavRows={setNavRows}
                />
              </div>
            )}
          </>
        )}

        {/* Vista crear preguntas */}
        {view === 'crear' && !showTokenPanel && (
          <>
            <button className="btn btn-secondary mb-4" style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} onClick={() => setView('')}>Volver</button>
            {/* Aquí va todo el código existente para crear preguntas */}
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
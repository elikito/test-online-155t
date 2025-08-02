import { useState, useMemo } from 'react';
import { QuestionCard, NavigationPanel, TestControls } from './test';

export default function TestPanel({ 
  questions, 
  current, 
  setCurrent, 
  selectedOption, 
  setSelectedOption, 
  handleAnswer, 
  nextQuestion, 
  correctCount, 
  incorrectCount, 
  showTopButtons = false, 
  navRows,
  setNavRows,
  showTema = false,
  preguntaUnica = true,
  autoNext = false
}) {
  const [showNavPanel, setShowNavPanel] = useState(true);
  
  const currentQuestion = questions[current];

  // Calcular el margen inferior dinámicamente basado en el panel de navegación
  const baseFooterHeight = 80;
  const BUTTON_SIZE = 36;
  const GAP_SIZE = 4;
  const totalRows = Math.ceil(questions.length / 8);
  const maxRows = Math.min(15, totalRows);
  const visibleRows = Math.max(1, Math.min(navRows, maxRows));
  const panelHeight = visibleRows * (BUTTON_SIZE + GAP_SIZE);
  const navPanelHeight = showNavPanel && preguntaUnica ? panelHeight + 32 : 0;
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
      {preguntaUnica ? (
        // Modo pregunta única
        currentQuestion && (
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
              <button 
                className="btn btn-primary mt-3" 
                style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }} 
                onClick={nextQuestion}
              >
                Siguiente
              </button>
            )}
            
            {selectedOption && current === questions.length - 1 && (
              <p className="mt-3 text-success">¡Has llegado al final del examen!</p>
            )}
          </div>
        )
      ) : (
        // Modo todas las preguntas
        <div style={{ marginBottom: `${baseFooterHeight + 20}px` }}>
          {questions.map((question, index) => (
            <div key={question.id_pregunta || index} className="mb-4">
              <QuestionCard
                question={question}
                questionNumber={index + 1}
                selectedOption={question.respuesta_usuario || null}
                onAnswer={(key) => handleAnswer(key, index)}
                showResult={!!question.respuesta_usuario}
                showTema={showTema}
              />
            </div>
          ))}
        </div>
      )}

      {/* Barra inferior fija - Solo mostrar en modo pregunta única */}
      {preguntaUnica && (
        <div 
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#f8f9fa',
            borderTop: '1px solid #dee2e6',
            padding: '5px',
            zIndex: 1000,
            boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
          }}
        >
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
      )}
    </>
  );
}
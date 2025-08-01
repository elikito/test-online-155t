export default function TestControls({ 
  correctCount, 
  incorrectCount, 
  current, 
  total, 
  onPrevious, 
  onNext, 
  onToggleNavPanel, 
  showNavPanel 
}) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      {/* Grupo izquierda - contadores */}
      <div className="d-flex align-items-center gap-3">
        {/* Versión móvil: iconos */}
        <span className="d-md-none">
          <span style={{ color: '#28a745' }}>✅</span> {correctCount}
        </span>
        <span className="d-md-none">
          <span style={{ color: '#dc3545' }}>❌</span> {incorrectCount}
        </span>
        {/* Versión escritorio: texto completo */}
        <span className="d-none d-md-inline">
          <strong>Correctas:</strong> {correctCount}
        </span>
        <span className="d-none d-md-inline">
          <strong>Incorrectas:</strong> {incorrectCount}
        </span>
      </div>
      
      {/* Grupo centro - controles */}
      <div className="d-flex align-items-center gap-2">
        <button
          className="btn btn-outline-info btn-sm"
          style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
          onClick={onToggleNavPanel}
          title={showNavPanel ? "Ocultar panel de navegación" : "Mostrar panel de navegación"}
        >
          {showNavPanel ? '👁️‍🗨️' : '👁️'}
        </button>
      </div>

      {/* Grupo derecha - navegación */}
      <div className="d-flex gap-2">
        <button 
          className="btn btn-outline-primary btn-sm"
          style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
          onClick={onPrevious}
          disabled={current === 0}
        >
          {/* Versión móvil: solo emoji */}
          <span className="d-md-none">⬅️</span>
          {/* Versión escritorio: texto completo */}
          <span className="d-none d-md-inline">Anterior</span>
        </button>
        <button 
          className="btn btn-outline-primary btn-sm"
          style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
          onClick={onNext}
          disabled={current === total - 1}
        >
          {/* Versión móvil: solo emoji */}
          <span className="d-md-none">➡️</span>
          {/* Versión escritorio: texto completo */}
          <span className="d-none d-md-inline">Siguiente</span>
        </button>
      </div>
    </div>
  );
}
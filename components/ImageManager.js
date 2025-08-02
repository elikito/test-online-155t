import { useState, useEffect } from 'react';

export default function ImageManager({ adminToken }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/images', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setError('Error cargando estadísticas');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const downloadImages = async () => {
    setDownloading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/admin/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ action: 'download' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuccess(`${data.message}. Descargadas: ${data.downloaded}, Fallidas: ${data.failed}`);
        await loadStats(); // Recargar estadísticas
      } else {
        setError('Error descargando imágenes');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setDownloading(false);
    }
  };

  const confirmClearCache = async () => {
    setClearing(true);
    setError('');
    setSuccess('');
    setShowClearConfirm(false);
    
    try {
      const response = await fetch('/api/admin/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ action: 'clear' })
      });
      
      if (response.ok) {
        setSuccess('Caché limpiado correctamente');
        await loadStats(); // Recargar estadísticas
      } else {
        setError('Error limpiando caché');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      loadStats();
    }
  }, [adminToken]);

  if (loading && !stats) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border"></div>
        <div>Cargando estadísticas...</div>
      </div>
    );
  }

  return (
    <div className="card mt-4">
      <div className="card-header">
        <h6 className="mb-0">🖼️ Gestión de Imágenes</h6>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && (
          <div className="alert alert-success alert-dismissible fade show">
            {success}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setSuccess('')}
            ></button>
          </div>
        )}

        {/* Panel de confirmación para limpiar caché */}
        {showClearConfirm && (
          <div className="alert alert-warning border-warning mb-4">
            <div className="d-flex align-items-center mb-3">
              <div className="me-3">
                <span style={{ fontSize: '24px' }}>⚠️</span>
              </div>
              <div>
                <h6 className="mb-1">¿Limpiar caché de imágenes?</h6>
                <p className="mb-0 text-muted">
                  Se eliminarán todas las imágenes descargadas y el archivo de caché. 
                  Tendrás que volver a descargar las imágenes.
                </p>
              </div>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-danger btn-sm"
                onClick={confirmClearCache}
                disabled={clearing}
              >
                {clearing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Limpiando...
                  </>
                ) : (
                  'Sí, limpiar caché'
                )}
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {!showClearConfirm && stats && (
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h5 className="card-title">📊 Preguntas</h5>
                  <p className="card-text mb-1">
                    <strong>{stats.questionsWithImages}</strong> de <strong>{stats.totalQuestions}</strong>
                  </p>
                  <small className="text-muted">preguntas con imágenes</small>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="card bg-light">
                <div className="card-body text-center">
                  <h5 className="card-title">🖼️ Imágenes</h5>
                  <p className="card-text mb-1">
                    <strong>{stats.downloadedImages}</strong> de <strong>{stats.totalImages}</strong>
                  </p>
                  <small className="text-muted">imágenes descargadas</small>
                </div>
              </div>
            </div>
          </div>
        )}

        {!showClearConfirm && stats && (
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>Progreso de descarga:</span>
              <span>{stats.totalImages > 0 ? Math.round((stats.downloadedImages / stats.totalImages) * 100) : 0}%</span>
            </div>
            <div className="progress">
              <div 
                className="progress-bar" 
                style={{ 
                  width: `${stats.totalImages > 0 ? (stats.downloadedImages / stats.totalImages) * 100 : 0}%` 
                }}
              ></div>
            </div>
            {stats.cacheSizeMB && (
              <small className="text-muted">
                Espacio usado: {stats.cacheSizeMB} MB
              </small>
            )}
          </div>
        )}

        {!showClearConfirm && (
          <div className="d-flex gap-2 flex-wrap">
            <button 
              className="btn btn-primary"
              onClick={downloadImages}
              disabled={downloading || clearing}
            >
              {downloading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  Descargando...
                </>
              ) : (
                '📥 Actualizar Imágenes'
              )}
            </button>
            
            <button 
              className="btn btn-outline-secondary"
              onClick={loadStats}
              disabled={loading || downloading || clearing}
            >
              🔄 Actualizar Stats
            </button>
            
            <button 
              className="btn btn-outline-danger"
              onClick={() => setShowClearConfirm(true)}
              disabled={downloading || clearing}
            >
              🗑️ Limpiar Caché
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
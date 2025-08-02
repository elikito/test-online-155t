import { useState, useEffect } from 'react';

export default function TokenManager() {
  const [tokens, setTokens] = useState([]);
  const [newToken, setNewToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados para gestión de imágenes
  const [imageStatus, setImageStatus] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showImageConfirm, setShowImageConfirm] = useState(false);
  const [imageConfirmAction, setImageConfirmAction] = useState(null);
  const [imageConfirmMessage, setImageConfirmMessage] = useState('');

  const authenticate = async () => {
    try {
      const response = await fetch('/api/auth/tokens', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTokens(data.tokens);
        setAuthenticated(true);
        setError('');
        // Cargar estado de imágenes
        loadImageStatus();
      } else {
        setError('Token de admin inválido');
      }
    } catch (error) {
      setError('Error de conexión');
    }
  };

  const loadImageStatus = async () => {
    try {
      const response = await fetch('/api/images/status', {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setImageStatus(data);
      }
    } catch (error) {
      console.error('Error loading image status:', error);
    }
  };

  const generateToken = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/tokens', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNewToken(data.token);
        setSuccess('Token generado correctamente');
        // Recargar tokens
        await authenticate();
      } else {
        setError('Error generando token');
      }
    } catch (error) {
      setError('Error generando token');
    } finally {
      setLoading(false);
    }
  };

  const downloadImages = async () => {
    setImageLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/images/download', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (response.ok) {
        setSuccess('Imágenes descargadas correctamente');
        loadImageStatus(); // Recargar estado
      } else {
        setError('Error descargando imágenes');
      }
    } catch (error) {
      setError('Error descargando imágenes');
    } finally {
      setImageLoading(false);
    }
  };

  const clearImageCache = async () => {
    setImageLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/images/clear-cache', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      
      if (response.ok) {
        setSuccess('Caché e imágenes eliminadas');
        loadImageStatus(); // Recargar estado
      } else {
        setError('Error eliminando caché');
      }
    } catch (error) {
      setError('Error eliminando caché');
    } finally {
      setImageLoading(false);
    }
  };

  const showImageConfirmDialog = (message, action) => {
    setImageConfirmMessage(message);
    setImageConfirmAction(() => action);
    setShowImageConfirm(true);
  };

  const handleImageConfirm = (confirmed) => {
    setShowImageConfirm(false);
    if (confirmed && imageConfirmAction) {
      imageConfirmAction();
    }
    setImageConfirmAction(null);
    setImageConfirmMessage('');
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token).then(() => {
      setSuccess('Token copiado al portapapeles');
      setTimeout(() => setSuccess(''), 3000);
    }).catch(() => {
      setError('Error copiando token');
    });
  };

  const logout = () => {
    setAuthenticated(false);
    setAdminToken('');
    setTokens([]);
    setNewToken('');
    setImageStatus(null);
    setError('');
    setSuccess('');
  };

  if (!authenticated) {
    return (
      <div className="container mt-4">
        <div className="card">
          <div className="card-body">
            <h5 className="card-title">🔐 Autenticación de Administrador</h5>
            <p className="text-muted">Introduce el token de administrador para gestionar tokens de acceso.</p>
            
            <div className="mb-3">
              <label className="form-label">Token de Administrador</label>
              <input
                type="password"
                className="form-control"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="Introduce el ADMIN_TOKEN..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && adminToken.trim()) {
                    authenticate();
                  }
                }}
              />
              <div className="form-text">
                Este es el valor de la variable de entorno ADMIN_TOKEN configurada en Vercel.
              </div>
            </div>
            
            {error && <div className="alert alert-danger">{error}</div>}
            
            <button 
              className="btn btn-primary" 
              onClick={authenticate}
              disabled={!adminToken.trim()}
            >
              🔓 Autenticar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      {/* Header con controles */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🎫 Gestión de Tokens</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-success" 
            onClick={generateToken}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-1"></span>
                Generando...
              </>
            ) : (
              '➕ Generar Token'
            )}
          </button>
          <button 
            className="btn btn-outline-secondary" 
            onClick={logout}
          >
            🚪 Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Mensajes */}
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

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Token recién generado */}
      {newToken && (
        <div className="card mb-4 border-warning">
          <div className="card-header bg-warning">
            <h6 className="mb-0">🆕 Nuevo Token Generado</h6>
          </div>
          <div className="card-body">
            <div className="input-group mb-3">
              <input 
                type="text" 
                className="form-control font-monospace" 
                value={newToken}
                readOnly
              />
              <button 
                className="btn btn-outline-primary"
                onClick={() => copyToken(newToken)}
              >
                📋 Copiar
              </button>
            </div>
            <div className="alert alert-info mb-0">
              <strong>⚠️ Importante:</strong> Guarda este token de forma segura. 
              Añádelo a la variable de entorno <code>VALID_TOKENS</code> en Vercel.
            </div>
          </div>
        </div>
      )}

      {/* Lista de tokens */}
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">Tokens Activos ({tokens.length})</h6>
        </div>
        <div className="card-body">
          {tokens.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token) => (
                    <tr key={token.id}>
                      <td>
                        <code className="text-muted">{token.preview}</code>
                      </td>
                      <td>
                        <span className="badge bg-success">✅ Activo</span>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => copyToken(token.full)}
                        >
                          📋 Copiar Completo
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              <h6>No hay tokens configurados</h6>
              <p>Genera el primer token para comenzar</p>
            </div>
          )}
        </div>
      </div>

      {/* Gestión de imágenes */}
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0">🖼️ Gestión de Imágenes</h6>
        </div>
        <div className="card-body">
          {imageStatus ? (
            <>
              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h6 className="card-title">📚 Preguntas</h6>
                      <p className="card-text mb-1">
                        <strong>{imageStatus.questions.withImages}</strong> de <strong>{imageStatus.questions.total}</strong> tienen imágenes
                      </p>
                      <small className="text-muted">
                        {((imageStatus.questions.withImages / imageStatus.questions.total) * 100).toFixed(1)}%
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <h6 className="card-title">🖼️ Imágenes</h6>
                      <p className="card-text mb-1">
                        <strong>{imageStatus.images.downloaded}</strong> de <strong>{imageStatus.images.total}</strong> descargadas
                      </p>
                      <small className="text-muted">
                        {imageStatus.images.missing > 0 ? (
                          <span className="text-warning">⚠️ {imageStatus.images.missing} faltantes</span>
                        ) : (
                          <span className="text-success">✅ Todas descargadas</span>
                        )}
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              {imageStatus.cache && (
                <div className="alert alert-info">
                  <strong>💾 Caché:</strong> {imageStatus.cache.count} imágenes almacenadas 
                  ({imageStatus.cache.totalSizeMB} MB)
                </div>
              )}

              {/* Añadir información de debug */}
              {imageStatus.debug && (
                <div className="alert alert-secondary">
                  <strong>🔍 Debug:</strong> {imageStatus.debug.filesProcessed} archivos JSON procesados
                  {imageStatus.debug.sampleImages && imageStatus.debug.sampleImages.length > 0 && (
                    <><br/><small>Ejemplos de imágenes: {imageStatus.debug.sampleImages.join(', ')}</small></>
                  )}
                </div>
              )}

              <div className="d-flex gap-2 justify-content-center">
                <button 
                  className="btn btn-primary"
                  onClick={() => showImageConfirmDialog(
                    `¿Descargar ${imageStatus.images.missing} imágenes faltantes? Esto puede tardar varios minutos.`,
                    downloadImages
                  )}
                  disabled={imageLoading || imageStatus.images.missing === 0}
                >
                  {imageLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span>
                      Descargando...
                    </>
                  ) : (
                    `📥 Descargar Imágenes (${imageStatus.images.missing})`
                  )}
                </button>
                
                <button 
                  className="btn btn-outline-warning"
                  onClick={() => showImageConfirmDialog(
                    '¿Eliminar toda la caché de imágenes? Esto borrará todas las imágenes descargadas.',
                    clearImageCache
                  )}
                  disabled={imageLoading || !imageStatus.cache}
                >
                  🗑️ Limpiar Caché
                </button>
                
                <button 
                  className="btn btn-outline-secondary"
                  onClick={loadImageStatus}
                  disabled={imageLoading}
                >
                  🔄 Actualizar Estado
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2 text-muted">Cargando estado de imágenes...</p>
            </div>
          )}
        </div>
      </div>

      {/* Instrucciones para Vercel */}
      <div className="card mt-4">
        <div className="card-header">
          <h6 className="mb-0">📋 Configuración en Vercel</h6>
        </div>
        <div className="card-body">
          <ol>
            <li>Ve al dashboard de tu proyecto en Vercel</li>
            <li>Navega a <strong>Settings → Environment Variables</strong></li>
            <li>Edita o crea la variable <code>VALID_TOKENS</code></li>
            <li>Añade todos los tokens separados por comas</li>
            <li>Redeploya la aplicación</li>
          </ol>
          
          <div className="alert alert-warning">
            <strong>Ejemplo de configuración:</strong><br/>
            <code>VALID_TOKENS=token1,token2,token3</code>
          </div>
        </div>
      </div>

      {/* Popup de confirmación para imágenes */}
      {showImageConfirm && (
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
            <p style={{ marginBottom: '20px', fontSize: '16px' }}>{imageConfirmMessage}</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                className="btn btn-primary"
                onClick={() => handleImageConfirm(true)}
                disabled={imageLoading}
              >
                Sí, continuar
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => handleImageConfirm(false)}
                disabled={imageLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
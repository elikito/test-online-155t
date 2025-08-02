import { useState } from 'react';

export default function TokenManager() {
  const [tokens, setTokens] = useState([]);
  const [newToken, setNewToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      } else {
        setError('Token de admin inválido');
      }
    } catch (error) {
      setError('Error de conexión');
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
      <div className="card">
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
    </div>
  );
}
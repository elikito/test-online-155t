export default function ConfirmDialog({ show, message, onConfirm, onCancel }) {
  if (!show) return null;

  return (
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
        <p style={{ marginBottom: '20px', fontSize: '16px' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            className="btn btn-danger"
            style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
            onClick={onConfirm}
          >
            Sí, continuar
          </button>
          <button 
            className="btn btn-secondary"
            style={{ fontSize: '0.875rem', padding: '0.375rem 0.75rem' }}
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
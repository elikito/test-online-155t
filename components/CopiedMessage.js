export default function CopiedMessage({ show }) {
  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(40, 167, 69, 0.65)',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '8px',
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        fontSize: '16px',
        fontWeight: '500',
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(4px)'
      }}
    >
      ¡Copiado!
    </div>
  );
}
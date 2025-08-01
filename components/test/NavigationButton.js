export default function NavigationButton({ 
  index, 
  question, 
  isCurrent, 
  onClick 
}) {
  const getButtonClass = () => {
    if (isCurrent) {
      return "btn btn-primary btn-sm";
    } else if (question.respuesta_usuario) {
      return question.respuesta_usuario === question.respuesta_correcta 
        ? "btn btn-success btn-sm" 
        : "btn btn-danger btn-sm";
    }
    return "btn btn-outline-secondary btn-sm";
  };

  const buttonNumber = (index + 1).toString().padStart(2, '0');

  return (
    <button
      className={getButtonClass()}
      style={{
        width: '36px',
        height: '36px',
        padding: 0,
        fontWeight: 'bold',
        fontSize: '12px',
        flex: '0 0 36px'
      }}
      onClick={() => onClick(index)}
    >
      {buttonNumber}
    </button>
  );
}
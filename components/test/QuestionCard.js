export default function QuestionCard({ 
  question, 
  questionNumber, 
  selectedOption, 
  onAnswer, 
  showResult = false 
}) {
  if (!question) return null;

  const handleOptionClick = (key) => {
    if (!selectedOption && onAnswer) {
      onAnswer(key);
    }
  };

  const getOptionClassName = (key) => {
    let className = "list-group-item";
    
    if (selectedOption) {
      if (key === question.respuesta_correcta) {
        className += " list-group-item-success";
      } else if (key === selectedOption) {
        className += " list-group-item-danger";
      }
    }
    
    return className;
  };

  const getOptionStyle = () => ({
    cursor: selectedOption ? 'default' : 'pointer',
    pointerEvents: selectedOption ? 'none' : 'auto'
  });

  return (
    <div className="card" style={{ 
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)', 
      borderRadius: 0, 
      margin: 0 
    }}>
      <div className="card-body">
        <h5 className="card-title">Pregunta {questionNumber}</h5>
        <p><strong>Tema:</strong> {question.tema || 'No especificado'}</p>
        <p className="card-text">{question.pregunta}</p>
        
        <ul className="list-group" style={{ marginBottom: 0 }}>
          {Object.entries(question.opciones).map(([key, value]) => (
            <li
              key={key}
              className={getOptionClassName(key)}
              style={getOptionStyle()}
              onClick={() => handleOptionClick(key)}
            >
              <strong>{key.toUpperCase()}:</strong> {value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
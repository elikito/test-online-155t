import NavigationButton from './NavigationButton';

export default function NavigationPanel({ 
  questions, 
  current, 
  onQuestionSelect, 
  navRows,
  isVisible 
}) {
  if (!isVisible) return null;

  const BUTTON_SIZE = 36;
  const GAP_SIZE = 4;
  const BUTTONS_PER_ROW = 8;

  const totalRows = Math.ceil(questions.length / BUTTONS_PER_ROW);
  const maxRows = Math.min(15, totalRows);
  const minRows = 1;

  const visibleRows = Math.max(minRows, Math.min(navRows, maxRows));
  const panelHeight = visibleRows * (BUTTON_SIZE + GAP_SIZE);
  const needsScroll = totalRows > visibleRows;

  return (
    <div style={{ position: 'relative' }}>
      <div
        className="d-flex flex-wrap gap-1 justify-content-center"
        style={{
          height: `${panelHeight}px`,
          overflowY: needsScroll ? 'auto' : 'hidden',
          transition: 'height 0.2s',
          width: '100%',
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          padding: '8px'
        }}
      >
        {questions.map((question, index) => (
          <NavigationButton
            key={question.id_pregunta || index}
            index={index}
            question={question}
            isCurrent={index === current}
            onClick={onQuestionSelect}
          />
        ))}
      </div>
    </div>
  );
}
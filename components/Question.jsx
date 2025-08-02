import { useState } from 'react';

export default function Question({ question, onAnswer, userAnswer, showResult }) {
  const handleAnswer = (answer) => {
    if (!showResult) {
      onAnswer(answer);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4">
        {question.pregunta}
      </h3>
      
      {/* Imagen de la pregunta */}
      {question.imagen && (
        <div className="mb-4 flex justify-center">
          <img 
            src={question.imagen} 
            alt="Imagen de la pregunta" 
            className="max-w-full h-auto rounded border shadow-sm"
            style={{ maxHeight: '400px' }}
          />
        </div>
      )}
      
      <div className="space-y-3">
        {Object.entries(question.opciones).map(([key, value]) => {
          const isSelected = userAnswer === key;
          const isCorrect = key === question.respuesta_correcta;
          const showCorrectAnswer = showResult && isCorrect;
          const showIncorrect = showResult && isSelected && !isCorrect;
          
          return (
            <div
              key={key}
              className={`p-3 border rounded cursor-pointer transition-colors ${
                showCorrectAnswer
                  ? 'bg-green-100 border-green-500'
                  : showIncorrect
                  ? 'bg-red-100 border-red-500'
                  : isSelected
                  ? 'bg-blue-100 border-blue-500'
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
              }`}
              onClick={() => handleAnswer(key)}
            >
              <div className="flex items-start space-x-3">
                <span className="font-semibold text-sm bg-gray-200 px-2 py-1 rounded">
                  {key.toUpperCase()}
                </span>
                <div className="flex-1">
                  <p className="text-sm">{value}</p>
                  
                  {/* Imagen de la opción si existe */}
                  {question.opciones_con_imagen?.[key]?.imagen && (
                    <div className="mt-2 flex justify-center">
                      <img 
                        src={question.opciones_con_imagen[key].imagen} 
                        alt={`Imagen opción ${key.toUpperCase()}`} 
                        className="max-w-full h-auto rounded border shadow-sm"
                        style={{ maxHeight: '200px' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
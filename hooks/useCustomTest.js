import { useState, useEffect } from 'react';

export function useCustomTest() {
  const [customNumQuestions, setCustomNumQuestions] = useState(10);
  const [customTema, setCustomTema] = useState('');
  const [customExam, setCustomExam] = useState('');
  const [customQuestions, setCustomQuestions] = useState([]);
  const [customTemas, setCustomTemas] = useState([]);
  const [customTemaCounts, setCustomTemaCounts] = useState({});
  const [customExamList, setCustomExamList] = useState([]);
  const [customLoading, setCustomLoading] = useState(false);
  const [customTestQuestions, setCustomTestQuestions] = useState([]);
  const [customTestStarted, setCustomTestStarted] = useState(false);
  const [customTestCurrent, setCustomTestCurrent] = useState(0);
  const [customTestSelected, setCustomTestSelected] = useState(null);
  const [customTestCorrect, setCustomTestCorrect] = useState(0);
  const [customTestIncorrect, setCustomTestIncorrect] = useState(0);

  const loadCustomQuestions = async () => {
    setCustomLoading(true);
    try {
      const res = await fetch('/api/all-questions');
      const allQuestions = await res.json();
      setCustomQuestions(allQuestions);

      const temaCounts = {};
      allQuestions.forEach(q => {
        temaCounts[q.tema] = (temaCounts[q.tema] || 0) + 1;
      });
      setCustomTemaCounts(temaCounts);
      setCustomTemas(Object.keys(temaCounts).sort());

      const exams = [...new Set(allQuestions.map(q => q.examen))];
      setCustomExamList(exams);
    } catch (error) {
      console.error('Error loading custom questions:', error);
    } finally {
      setCustomLoading(false);
    }
  };

  const getFilteredCustomQuestions = () => {
    let filtered = customQuestions;
    if (customExam) filtered = filtered.filter(q => q.examen === customExam);
    if (customTema) filtered = filtered.filter(q => q.tema === customTema);
    return filtered;
  };

  const startCustomTest = () => {
    const filtered = getFilteredCustomQuestions();
    const shuffled = filtered.sort(() => Math.random() - 0.5).slice(0, customNumQuestions);
    setCustomTestQuestions(shuffled);
    setCustomTestStarted(true);
    setCustomTestCurrent(0);
    setCustomTestSelected(null);
    setCustomTestCorrect(0);
    setCustomTestIncorrect(0);
  };

  const handleCustomTestAnswer = (key) => {
    if (customTestQuestions[customTestCurrent].respuesta_usuario) return;
    setCustomTestSelected(key);
    const updated = [...customTestQuestions];
    updated[customTestCurrent].respuesta_usuario = key;
    setCustomTestQuestions(updated);
    if (key === updated[customTestCurrent].respuesta_correcta) {
      setCustomTestCorrect(prev => prev + 1);
    } else {
      setCustomTestIncorrect(prev => prev + 1);
    }
  };

  const nextCustomTestQuestion = () => {
    setCustomTestSelected(null);
    setCustomTestCurrent(prev => prev + 1);
  };

  const resetCustomTest = () => {
    setCustomTestCorrect(0);
    setCustomTestIncorrect(0);
    const resetQuestions = customTestQuestions.map(q => {
      const { respuesta_usuario, ...rest } = q;
      return rest;
    });
    setCustomTestQuestions(resetQuestions);
    setCustomTestCurrent(0);
    setCustomTestSelected(null);
  };

  const createNewCustomTest = () => {
    setCustomTestStarted(false);
    setCustomTestQuestions([]);
    setCustomTestCurrent(0);
    setCustomTestSelected(null);
    setCustomTestCorrect(0);
    setCustomTestIncorrect(0);
    setCustomExam('');
    setCustomTema('');
    setCustomNumQuestions(10);
  };

  return {
    // States
    customNumQuestions,
    setCustomNumQuestions,
    customTema,
    setCustomTema,
    customExam,
    setCustomExam,
    customQuestions,
    customTemas,
    customTemaCounts,
    customExamList,
    customLoading,
    customTestQuestions,
    setCustomTestQuestions,
    customTestStarted,
    customTestCurrent,
    setCustomTestCurrent,
    customTestSelected,
    setCustomTestSelected,
    customTestCorrect,
    customTestIncorrect,
    
    // Functions
    loadCustomQuestions,
    getFilteredCustomQuestions,
    startCustomTest,
    handleCustomTestAnswer,
    nextCustomTestQuestion,
    resetCustomTest,
    createNewCustomTest
  };
}
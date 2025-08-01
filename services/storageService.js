class StorageService {
  static saveAnswers(examName, questions) {
    try {
      localStorage.setItem(`respuestas_${examName}`, JSON.stringify(questions));
      return true;
    } catch (error) {
      console.error('Error saving answers:', error);
      return false;
    }
  }

  static loadAnswers(examName) {
    try {
      const saved = localStorage.getItem(`respuestas_${examName}`);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading answers:', error);
      return null;
    }
  }

  static saveFailedQuestions(questions) {
    try {
      const failed = questions.filter(q => 
        q.respuesta_usuario && q.respuesta_usuario !== q.respuesta_correcta
      );
      localStorage.setItem('fallos_ultimo_test', JSON.stringify(failed));
      return true;
    } catch (error) {
      console.error('Error saving failed questions:', error);
      return false;
    }
  }

  static loadFailedQuestions() {
    try {
      const saved = localStorage.getItem('fallos_ultimo_test');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading failed questions:', error);
      return [];
    }
  }

  static clearAnswers(examName) {
    try {
      localStorage.removeItem(`respuestas_${examName}`);
      return true;
    } catch (error) {
      console.error('Error clearing answers:', error);
      return false;
    }
  }

  static saveCustomQuestions(questions) {
    try {
      localStorage.setItem('custom_questions', JSON.stringify(questions));
      return true;
    } catch (error) {
      console.error('Error saving custom questions:', error);
      return false;
    }
  }

  static loadCustomQuestions() {
    try {
      const saved = localStorage.getItem('custom_questions');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading custom questions:', error);
      return [];
    }
  }
}

export default StorageService;
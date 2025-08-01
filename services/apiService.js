class ApiService {
  static async getAllQuestions() {
    try {
      const response = await fetch('/api/all-questions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading all questions:', error);
      throw new Error('Error al cargar todas las preguntas');
    }
  }

  static async getExamFiles() {
    try {
      const response = await fetch('/api/exams');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading exam files:', error);
      throw new Error('Error al cargar la lista de exámenes');
    }
  }

  static async loadExam(filename) {
    try {
      const response = await fetch(`/exams/${filename}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading exam ${filename}:`, error);
      throw new Error(`Error al cargar el examen: ${filename}`);
    }
  }

  static async validateTemarioAccess(password) {
    try {
      const response = await fetch('/api/temario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      
      if (!response.ok) {
        throw new Error('Invalid password');
      }
      return await response.json();
    } catch (error) {
      console.error('Error validating temario access:', error);
      throw new Error('Contraseña incorrecta');
    }
  }

  static async loadTemario() {
    try {
      const response = await fetch('/temario.txt');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => /^\d+(\.\d+)*\s*-\s+/.test(line));
    } catch (error) {
      console.error('Error loading temario:', error);
      throw new Error('Error al cargar el temario');
    }
  }

  static async fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
        if (i === maxRetries - 1) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        // Esperar antes de reintentar (backoff exponencial)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
}

export default ApiService;
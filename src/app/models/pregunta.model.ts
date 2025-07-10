export interface Pregunta {
  id: number;
  pregunta: string;
  opciones: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  respuesta_correcta: string;
}

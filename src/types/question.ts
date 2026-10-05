export type QuestionId = string;

export type Question = {
  id: QuestionId;
  fecha: string | null;
  orden: 1 | 2 | 3 | 4 | 5;
  pregunta: string;
  lugar: string;
  lat: number;
  lng: number;
  pais: string;
  deporte: string;
  dificultad: 1 | 2 | 3 | 4 | 5;
  historia: string;
  fuente: string;
  verificada: boolean;
};

/** Lo que el navegador puede ver antes del toque: sin coordenadas ni nombre del lugar. */
export type PublicQuestion = Pick<
  Question,
  "id" | "orden" | "pregunta" | "deporte" | "dificultad"
>;

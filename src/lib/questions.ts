import { createAdminClient } from "@/lib/supabase/admin";
import type { PublicQuestion, Question } from "@/types/question";

/** Columnas de la tabla questions que necesita el juego. */
export const QUESTION_COLUMNS =
  "id, round_date, position, prompt, place_name, lat, lng, country_code, sport, difficulty, hints, story, source_url";

export type QuestionRow = {
  id: string;
  round_date: string | null;
  position: number | null;
  prompt: string;
  place_name: string;
  lat: number;
  lng: number;
  country_code: string;
  sport: string;
  difficulty: number;
  hints: string[];
  story: string;
  source_url: string | null;
};

/** Fila de la base al tipo que usa el juego. Solo para preguntas con fecha y lugar asignados. */
export function rowToQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    fecha: row.round_date,
    orden: row.position as Question["orden"],
    pregunta: row.prompt,
    lugar: row.place_name,
    lat: row.lat,
    lng: row.lng,
    pais: row.country_code,
    deporte: row.sport,
    dificultad: row.difficulty as Question["dificultad"],
    pistas: row.hints,
    historia: row.story,
    fuente: row.source_url ?? "",
  };
}

export function toPublicQuestion(question: Question): PublicQuestion {
  return {
    id: question.id,
    orden: question.orden,
    pregunta: question.pregunta,
    deporte: question.deporte,
    dificultad: question.dificultad,
    pistas: question.pistas.slice(0, 3),
  };
}

/**
 * Ronda de una fecha: las preguntas aprobadas de ese día, ordenadas por lugar.
 * Lista vacía si el día no tiene preguntas. Null si la base falló.
 */
export async function getPublicRound(date: string): Promise<PublicQuestion[] | null> {
  const { data, error } = await createAdminClient()
    .from("questions")
    .select(QUESTION_COLUMNS)
    .eq("round_date", date)
    .eq("status", "approved")
    .order("position", { ascending: true });

  if (error || !data) {
    console.error("No se pudo leer la ronda", error);
    return null;
  }

  return (data as QuestionRow[]).map((row) => toPublicQuestion(rowToQuestion(row)));
}

/**
 * Busca una pregunta aprobada cuya fecha sea alguna de las dadas.
 * Null si no está o si es de otro día. Lanza un error si la base falló.
 */
export async function findRoundQuestion(
  questionId: string,
  dates: string[],
): Promise<{ date: string; question: Question } | null> {
  const { data, error } = await createAdminClient()
    .from("questions")
    .select(QUESTION_COLUMNS)
    .eq("id", questionId)
    .eq("status", "approved")
    .in("round_date", dates)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo leer la pregunta ${questionId}: ${error.message}`);
  }
  if (!data) return null;

  const question = rowToQuestion(data as QuestionRow);
  return question.fecha ? { date: question.fecha, question } : null;
}

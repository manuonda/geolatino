import { sql } from "./sql";

type QuestionFixture = {
  id: string;
  date?: string | null;
  position?: number | null;
  status?: "draft" | "ai_reviewed" | "approved" | "rejected";
  country?: string;
  lat?: number;
  lng?: number;
};

const quote = (value: string | null) => (value === null ? "null" : `'${value.replace(/'/g, "''")}'`);

/** Inserta una pregunta válida con los campos que importan para el test. */
export function insertQuestion(q: QuestionFixture) {
  const date = q.date ?? null;
  const position = q.position ?? (date ? 1 : null);
  sql(`insert into questions
    (id, round_date, position, prompt, place_name, lat, lng, country_code, difficulty, hints, story, status)
    values (${quote(q.id)}, ${quote(date)}, ${position ?? "null"}, 'Acertijo ${q.id}', 'Lugar ${q.id}',
      ${q.lat ?? -34.6}, ${q.lng ?? -58.4}, '${q.country ?? "AR"}', 2,
      array['p1','p2','p3'], 'Historia ${q.id}', '${q.status ?? "approved"}');`);
}

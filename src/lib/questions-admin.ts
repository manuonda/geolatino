import { addDays, buildCalendar, type CalendarDay } from "@/features/admin/calendar";
import type { QuestionInput } from "@/features/admin/questionSchema";
import { createAdminClient } from "@/lib/supabase/admin";

const UNIQUE_VIOLATION = "23505";
const LIST_LIMIT = 200;

export type QuestionStatus = "draft" | "ai_reviewed" | "approved" | "rejected";
export const QUESTION_STATUSES: QuestionStatus[] = ["draft", "ai_reviewed", "approved", "rejected"];

export type AdminQuestion = QuestionInput & {
  id: string;
  roundDate: string | null;
  position: number | null;
  status: QuestionStatus;
  isReserve: boolean;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectReason: string | null;
  createdAt: string;
};

export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string };

const COLUMNS =
  "id, round_date, position, prompt, place_name, lat, lng, country_code, sport, difficulty, hints, story, source_url, status, is_reserve, reviewed_by, reviewed_at, reject_reason, created_at";

type Row = {
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
  status: QuestionStatus;
  is_reserve: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reject_reason: string | null;
  created_at: string;
};

function fromRow(row: Row): AdminQuestion {
  return {
    id: row.id,
    roundDate: row.round_date,
    position: row.position,
    prompt: row.prompt,
    placeName: row.place_name,
    lat: row.lat,
    lng: row.lng,
    countryCode: row.country_code,
    sport: row.sport,
    difficulty: row.difficulty,
    hints: row.hints as AdminQuestion["hints"],
    story: row.story,
    sourceUrl: row.source_url,
    status: row.status,
    isReserve: row.is_reserve,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    rejectReason: row.reject_reason,
    createdAt: row.created_at,
  };
}

function toColumns(input: QuestionInput) {
  return {
    prompt: input.prompt,
    place_name: input.placeName,
    lat: input.lat,
    lng: input.lng,
    country_code: input.countryCode,
    sport: input.sport,
    difficulty: input.difficulty,
    hints: input.hints,
    story: input.story,
    source_url: input.sourceUrl,
  };
}

/** Una pregunta cuyo día ya llegó puede tener jugadas guardadas: no se le cambia la respuesta ni la fecha. */
export function isLocked(question: Pick<AdminQuestion, "roundDate">, today: string): boolean {
  return question.roundDate !== null && question.roundDate <= today;
}

/** Campos que cambiarían, sin contar la historia. */
function changedGameFields(current: AdminQuestion, input: QuestionInput): string[] {
  const keys: (keyof QuestionInput)[] = [
    "prompt", "placeName", "lat", "lng", "countryCode", "sport", "difficulty", "hints", "sourceUrl",
  ];
  return keys.filter((key) => JSON.stringify(current[key]) !== JSON.stringify(input[key]));
}

const dbError = (what: string, error: unknown): Result<never> => {
  console.error(what, error);
  return { ok: false, error: `${what}. Probá de nuevo.` };
};

export type QuestionFilters = {
  status?: QuestionStatus;
  country?: string;
  search?: string;
  /** Solo las que no tienen día asignado. */
  unassigned?: boolean;
};

export async function listQuestions(filters: QuestionFilters = {}): Promise<AdminQuestion[] | null> {
  let query = createAdminClient().from("questions").select(COLUMNS);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.country) query = query.eq("country_code", filters.country.toUpperCase());
  if (filters.unassigned) query = query.is("round_date", null);
  if (filters.search) {
    // Las comas y paréntesis rompen la sintaxis de filtros de PostgREST.
    const term = filters.search.replace(/[,()%]/g, " ").trim();
    if (term) query = query.or(`place_name.ilike.%${term}%,prompt.ilike.%${term}%`);
  }

  const { data, error } = await query
    .order("round_date", { ascending: false, nullsFirst: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (error || !data) {
    console.error("No se pudieron listar las preguntas", error);
    return null;
  }
  return (data as Row[]).map(fromRow);
}

export async function getQuestion(id: string): Promise<AdminQuestion | null> {
  const { data, error } = await createAdminClient()
    .from("questions")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("No se pudo leer la pregunta", error);
  return data ? fromRow(data as Row) : null;
}

/** Crea la pregunta como borrador, sin día asignado. */
export async function createQuestion(input: QuestionInput): Promise<Result<string>> {
  const { data, error } = await createAdminClient()
    .from("questions")
    .insert({ ...toColumns(input), status: "draft" })
    .select("id")
    .single();
  if (error || !data) return dbError("No se pudo crear la pregunta", error);
  return { ok: true, value: data.id };
}

export async function updateQuestion(id: string, input: QuestionInput, today: string): Promise<Result> {
  const current = await getQuestion(id);
  if (!current) return { ok: false, error: "La pregunta no existe" };

  let columns: Record<string, unknown> = toColumns(input);
  if (isLocked(current, today)) {
    if (changedGameFields(current, input).length > 0) {
      return { ok: false, error: "Esta pregunta ya se jugó: solo se puede corregir la historia." };
    }
    columns = { story: input.story };
  }

  const { error } = await createAdminClient()
    .from("questions")
    .update({ ...columns, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return dbError("No se pudo guardar la pregunta", error);
  return { ok: true, value: undefined };
}

export async function approveQuestion(id: string, reviewer: string): Promise<Result> {
  const { data, error } = await createAdminClient()
    .from("questions")
    .update({
      status: "approved",
      reviewed_by: reviewer,
      reviewed_at: new Date().toISOString(),
      reject_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id");
  if (error) return dbError("No se pudo aprobar la pregunta", error);
  if (!data?.length) return { ok: false, error: "La pregunta no existe" };
  return { ok: true, value: undefined };
}

/** Rechaza y libera el día que tuviera asignado. No se puede si ya se jugó. */
export async function rejectQuestion(
  id: string,
  reviewer: string,
  reason: string,
  today: string,
): Promise<Result> {
  if (!reason.trim()) return { ok: false, error: "Escribí el motivo del rechazo" };
  const current = await getQuestion(id);
  if (!current) return { ok: false, error: "La pregunta no existe" };
  if (isLocked(current, today)) {
    return { ok: false, error: "Esta pregunta ya se jugó: no se puede rechazar." };
  }

  const { error } = await createAdminClient()
    .from("questions")
    .update({
      status: "rejected",
      round_date: null,
      position: null,
      is_reserve: false,
      reviewed_by: reviewer,
      reviewed_at: new Date().toISOString(),
      reject_reason: reason.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return dbError("No se pudo rechazar la pregunta", error);
  return { ok: true, value: undefined };
}

/**
 * Asigna la pregunta a un día y lugar, o la saca del calendario con date = null.
 * Solo preguntas aprobadas, hoy o días futuros, y nunca una que ya se jugó.
 */
export async function assignQuestion(
  id: string,
  slot: { date: string; position: number } | null,
  today: string,
): Promise<Result> {
  const current = await getQuestion(id);
  if (!current) return { ok: false, error: "La pregunta no existe" };
  if (isLocked(current, today)) {
    return { ok: false, error: "Esta pregunta ya se jugó: no se puede mover." };
  }
  if (slot) {
    if (current.status !== "approved") {
      return { ok: false, error: "Solo se asignan preguntas aprobadas" };
    }
    // Hoy se permite, para completar una ronda vacía; desde ese momento la pregunta queda bloqueada.
    if (slot.date < today) {
      return { ok: false, error: "No se puede asignar a un día que ya pasó" };
    }
    if (!Number.isInteger(slot.position) || slot.position < 1 || slot.position > 5) {
      return { ok: false, error: "El lugar va de 1 a 5" };
    }
  }

  const { error } = await createAdminClient()
    .from("questions")
    .update({
      round_date: slot?.date ?? null,
      position: slot?.position ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error?.code === UNIQUE_VIOLATION) {
    return { ok: false, error: `El lugar ${slot?.position} del ${slot?.date} ya está ocupado` };
  }
  if (error) return dbError("No se pudo asignar la pregunta", error);
  return { ok: true, value: undefined };
}

/** Los próximos `days` días desde `from`, con sus 5 lugares. Null si la base falló. */
export async function getCalendar(from: string, days: number): Promise<CalendarDay[] | null> {
  const { data, error } = await createAdminClient()
    .from("questions")
    .select("id, round_date, position, place_name, status")
    .gte("round_date", from)
    .lte("round_date", addDays(from, days - 1));

  if (error || !data) {
    console.error("No se pudo leer el calendario", error);
    return null;
  }
  return buildCalendar(
    from,
    days,
    data.map((row) => ({
      id: row.id,
      roundDate: row.round_date as string,
      position: row.position as number,
      placeName: row.place_name,
      status: row.status,
    })),
  );
}

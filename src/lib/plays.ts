import { createAdminClient } from "@/lib/supabase/admin";

const UNIQUE_VIOLATION = "23505";
const RANKING_LIMIT = 50;

export type PlayInput = {
  playerId: string;
  roundDate: string;
  questionId: string;
  guess: { lat: number; lng: number };
  distanceKm: number;
  hintsUsed: number;
  rawScore: number;
  score: number;
};

export type StoredPlay = Omit<PlayInput, "playerId" | "roundDate" | "questionId">;

export type RankingRow = {
  playerId: string;
  displayName: string;
  avatarUrl: string | null;
  totalScore: number;
  answered: number;
};

const PLAY_COLUMNS = "guess_lat, guess_lng, distance_km, hints_used, raw_score, score";

/**
 * Guarda la jugada si es la primera del jugador para esa pregunta y fecha.
 * Si ya había una, devuelve la guardada. Null si la base falló.
 */
export async function saveFirstPlay(input: PlayInput): Promise<StoredPlay | null> {
  const admin = createAdminClient();

  const { error } = await admin.from("plays").insert({
    player_id: input.playerId,
    round_date: input.roundDate,
    question_id: input.questionId,
    guess_lat: input.guess.lat,
    guess_lng: input.guess.lng,
    distance_km: input.distanceKm,
    hints_used: input.hintsUsed,
    raw_score: input.rawScore,
    score: input.score,
  });

  if (!error) {
    return {
      guess: input.guess,
      distanceKm: input.distanceKm,
      hintsUsed: input.hintsUsed,
      rawScore: input.rawScore,
      score: input.score,
    };
  }

  if (error.code !== UNIQUE_VIOLATION) {
    console.error("No se pudo guardar la jugada", error);
    return null;
  }

  const { data, error: readError } = await admin
    .from("plays")
    .select(PLAY_COLUMNS)
    .eq("player_id", input.playerId)
    .eq("round_date", input.roundDate)
    .eq("question_id", input.questionId)
    .single();

  if (readError || !data) {
    console.error("No se pudo leer la jugada guardada", readError);
    return null;
  }

  return {
    guess: { lat: data.guess_lat, lng: data.guess_lng },
    distanceKm: Number(data.distance_km),
    hintsUsed: data.hints_used,
    rawScore: data.raw_score,
    score: data.score,
  };
}

/** Ranking de una ronda: mayor puntaje primero; a igual puntaje, quien terminó antes. Null si la base falló. */
export async function getDailyRanking(roundDate: string): Promise<RankingRow[] | null> {
  const { data, error } = await createAdminClient()
    .from("daily_ranking")
    .select("player_id, display_name, avatar_url, total_score, answered")
    .eq("round_date", roundDate)
    .order("total_score", { ascending: false })
    .order("finished_at", { ascending: true })
    .limit(RANKING_LIMIT);

  if (error || !data) {
    console.error("No se pudo leer el ranking", error);
    return null;
  }

  return data.map((row) => ({
    playerId: row.player_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    totalScore: Number(row.total_score),
    answered: Number(row.answered),
  }));
}

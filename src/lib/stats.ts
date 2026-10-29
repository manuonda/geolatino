import { addDays } from "@/features/admin/calendar";
import { summarizeStreaks } from "@/features/profile/streaks";
import { createAdminClient } from "@/lib/supabase/admin";

export const HISTORY_DAYS = 30;
/** Puntaje crudo desde el que una respuesta cuenta como acierto (el chip verde). */
const HIT_RAW_SCORE = 80;

export type HistoryDay = {
  date: string;
  score: number | null;
  rank: number | null;
  players: number | null;
};

export type CountryStat = { country: string; answered: number; hits: number };

export type PlayerStats = {
  roundsPlayed: number;
  questionsAnswered: number;
  totalScore: number;
  hits: number;
  perfect: number;
  avgDistanceKm: number | null;
  avgHints: number | null;
  bestScore: number | null;
  avgRoundScore: number | null;
  bestRank: number | null;
  streak: { current: number; best: number };
  history: HistoryDay[];
  countries: CountryStat[];
};

const num = (value: unknown) => (value === null || value === undefined ? null : Number(value));

/** Agrupa las jugadas por país de la pregunta, de más jugado a menos. */
export function countryStats(plays: { raw_score: number; country: string | null }[]): CountryStat[] {
  const byCountry = new Map<string, CountryStat>();
  for (const play of plays) {
    if (!play.country) continue;
    const stat = byCountry.get(play.country) ?? { country: play.country, answered: 0, hits: 0 };
    stat.answered += 1;
    if (play.raw_score >= HIT_RAW_SCORE) stat.hits += 1;
    byCountry.set(play.country, stat);
  }
  return [...byCountry.values()].sort((a, b) => b.answered - a.answered || a.country.localeCompare(b.country));
}

/** Estadísticas del jugador. Null si la base falló. */
export async function getPlayerStats(
  playerId: string,
  today: string,
  yesterday: string,
): Promise<PlayerStats | null> {
  const db = createAdminClient();
  const from = addDays(today, -(HISTORY_DAYS - 1));

  const [totals, streaks, rounds, plays] = await Promise.all([
    db.from("player_stats").select("*").eq("player_id", playerId).maybeSingle(),
    db.from("player_streaks").select("start_date, end_date, length").eq("player_id", playerId),
    db
      .from("player_rounds")
      .select("round_date, total_score, rank, players")
      .eq("player_id", playerId)
      .gte("round_date", from)
      .lte("round_date", today),
    db.from("plays").select("raw_score, questions(country_code)").eq("player_id", playerId),
  ]);

  const failed = [totals, streaks, rounds, plays].find((r) => r.error);
  if (failed) {
    console.error("No se pudieron leer las estadísticas", failed.error);
    return null;
  }

  const t = totals.data;
  const byDate = new Map((rounds.data ?? []).map((r) => [r.round_date as string, r]));
  const history = Array.from({ length: HISTORY_DAYS }, (_, i) => {
    const date = addDays(from, i);
    const round = byDate.get(date);
    return {
      date,
      score: num(round?.total_score),
      rank: num(round?.rank),
      players: num(round?.players),
    };
  });

  return {
    roundsPlayed: Number(t?.rounds_played ?? 0),
    questionsAnswered: Number(t?.questions_answered ?? 0),
    totalScore: Number(t?.total_score ?? 0),
    hits: Number(t?.hits ?? 0),
    perfect: Number(t?.perfect ?? 0),
    avgDistanceKm: num(t?.avg_distance_km),
    avgHints: num(t?.avg_hints),
    bestScore: num(t?.best_score),
    avgRoundScore: num(t?.avg_round_score),
    bestRank: num(t?.best_rank),
    streak: summarizeStreaks(
      (streaks.data ?? []).map((s) => ({
        startDate: s.start_date,
        endDate: s.end_date,
        length: Number(s.length),
      })),
      today,
      yesterday,
    ),
    history,
    countries: countryStats(
      (plays.data ?? []).map((p) => {
        // PostgREST devuelve la pregunta embebida como objeto (relación muchos a uno).
        const question = p.questions as unknown as { country_code: string } | null;
        return { raw_score: p.raw_score, country: question?.country_code ?? null };
      }),
    ),
  };
}

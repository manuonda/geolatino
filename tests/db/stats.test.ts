import { beforeEach, describe, expect, it } from "vitest";
import { getPlayerStats } from "@/lib/stats";
import { insertQuestion } from "./fixtures";
import { createPlayer, resetData, sql } from "./sql";

const ANA = "00000000-0000-0000-0000-0000000000a1";
const BETO = "00000000-0000-0000-0000-0000000000b2";
const TODAY = "2026-11-10";
const YESTERDAY = "2026-11-09";

function play(player: string, date: string, question: string, raw: number, score = raw, finished = "12:00") {
  sql(`insert into plays (player_id, round_date, question_id, guess_lat, guess_lng, distance_km, hints_used, raw_score, score, created_at)
       values ('${player}', '${date}', '${question}', 0, 0, ${100 - raw}, 1, ${raw}, ${score}, '${date} ${finished}')`);
}

beforeEach(() => {
  resetData();
  createPlayer(ANA, "Ana");
  createPlayer(BETO, "Beto");
  // Una pregunta por día y país, en el lugar 1.
  const days = ["2026-11-01", "2026-11-02", "2026-11-03", "2026-11-05", "2026-11-08", "2026-11-09"];
  days.forEach((d, i) => insertQuestion({ id: `Q${i}`, date: d, position: 1, country: i % 2 ? "BR" : "AR" }));
});

describe("getPlayerStats", () => {
  it("jugador sin jugadas: ceros y 30 días vacíos", async () => {
    const stats = await getPlayerStats(ANA, TODAY, YESTERDAY);
    expect(stats).toMatchObject({ roundsPlayed: 0, totalScore: 0, bestScore: null, streak: { current: 0, best: 0 } });
    expect(stats?.history).toHaveLength(30);
    expect(stats?.history.every((d) => d.score === null)).toBe(true);
  });

  it("calcula totales, rachas, posición, historial y países", async () => {
    // Ana: 1, 2, 3 seguidos; 5 suelto; 8 y 9 seguidos (racha viva porque ayer jugó).
    play(ANA, "2026-11-01", "Q0", 100);
    play(ANA, "2026-11-02", "Q1", 90);
    play(ANA, "2026-11-03", "Q2", 40);
    play(ANA, "2026-11-05", "Q3", 85);
    play(ANA, "2026-11-08", "Q4", 60, 60, "13:00");
    play(ANA, "2026-11-09", "Q5", 70);
    // Beto le gana el día 8.
    play(BETO, "2026-11-08", "Q4", 95);

    const stats = await getPlayerStats(ANA, TODAY, YESTERDAY);

    expect(stats).toMatchObject({
      roundsPlayed: 6,
      questionsAnswered: 6,
      totalScore: 445,
      hits: 3,
      perfect: 1,
      bestScore: 100,
      bestRank: 1,
      streak: { current: 2, best: 3 },
    });
    const day8 = stats?.history.find((d) => d.date === "2026-11-08");
    expect(day8).toEqual({ date: "2026-11-08", score: 60, rank: 2, players: 2 });
    expect(stats?.history.at(-1)).toEqual({ date: TODAY, score: null, rank: null, players: null });
    expect(stats?.countries).toEqual([
      { country: "AR", answered: 3, hits: 1 },
      { country: "BR", answered: 3, hits: 2 },
    ]);
  });

  it("a igual puntaje gana quien terminó antes", async () => {
    play(ANA, "2026-11-08", "Q4", 80, 80, "15:00");
    play(BETO, "2026-11-08", "Q4", 80, 80, "09:00");
    const stats = await getPlayerStats(ANA, TODAY, YESTERDAY);
    expect(stats?.bestRank).toBe(2);
  });
});

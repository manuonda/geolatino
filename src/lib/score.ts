/** Pregunta 1×1, 2×1, 3×2, 4×3, 5×3. Máximo de ronda: 1000. */
export const MULTIPLIERS = [1, 1, 2, 3, 3] as const;

export type ChipColor = "green" | "yellow" | "red";

/**
 * Curva del spec (a calibrar):
 * puntos = min(100, max(0, 177 - 19.7 * ln(d_km)))
 */
export function rawScoreFromDistanceKm(distanceKm: number): number {
  if (distanceKm <= 5) return 100;
  if (distanceKm >= 8000) return 0;

  const score = 177 - 19.7 * Math.log(distanceKm);
  return Math.min(100, Math.max(0, Math.round(score)));
}

export function chipColor(rawScore: number): ChipColor {
  if (rawScore >= 80) return "green";
  if (rawScore >= 50) return "yellow";
  return "red";
}

export const HINT_PENALTY = 15;
export const MAX_HINTS = 3;

export function applyHints(rawScore: number, hintsUsed: number): number {
  const used = Math.min(MAX_HINTS, Math.max(0, Math.round(hintsUsed)));
  return Math.min(100, Math.max(0, rawScore - used * HINT_PENALTY));
}

export function stakeForQuestion(questionOrder: 1 | 2 | 3 | 4 | 5) {
  const multiplier = MULTIPLIERS[questionOrder - 1];
  return { multiplier, maxPoints: 100 * multiplier };
}

export function applyMultiplier(rawScore: number, questionOrder: 1 | 2 | 3 | 4 | 5) {
  const multiplier = MULTIPLIERS[questionOrder - 1];
  return { multiplier, score: rawScore * multiplier };
}

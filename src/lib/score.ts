/** Pregunta 1×1, 2×1, 3×2, 4×3, 5×3. Máximo de ronda: 1000. */
export const MULTIPLIERS = [1, 1, 2, 3, 3] as const;

export type ChipColor = "green" | "yellow" | "red";

/** Hasta esta distancia la respuesta cuenta como acierto pleno. */
export const PERFECT_RADIUS_KM = 50;
/** Cada esta cantidad de km de error más allá del radio perfecto, los puntos se reducen a la mitad. */
export const HALF_LIFE_KM = 700;

/** Decaimiento exponencial: puntos = 100 × 0,5^((km − 50) / 700). */
export function rawScoreFromDistanceKm(distanceKm: number): number {
  const extraKm = Math.max(0, distanceKm - PERFECT_RADIUS_KM);
  return Math.round(100 * 0.5 ** (extraKm / HALF_LIFE_KM));
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

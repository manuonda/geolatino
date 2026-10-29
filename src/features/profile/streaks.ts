export type Streak = { startDate: string; endDate: string; length: number };

/**
 * Racha actual: la que termina hoy o ayer (si jugó ayer, todavía puede seguirla hoy).
 * Racha máxima: la más larga.
 */
export function summarizeStreaks(
  streaks: Streak[],
  today: string,
  yesterday: string,
): { current: number; best: number } {
  const best = streaks.reduce((max, s) => Math.max(max, s.length), 0);
  const live = streaks.find((s) => s.endDate === today || s.endDate === yesterday);
  return { current: live?.length ?? 0, best };
}

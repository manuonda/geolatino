export const ROUND_RECAP_KEY = "geolatino-round-recap";

export type RoundRecap = {
  date: string;
  totalScore: number;
  plays: import("@/features/round/services/roundService").PlayResult[];
};

export function saveRoundRecap(recap: RoundRecap) {
  sessionStorage.setItem(ROUND_RECAP_KEY, JSON.stringify(recap));
}

export function readRoundRecap(): RoundRecap | null {
  const raw = sessionStorage.getItem(ROUND_RECAP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RoundRecap;
  } catch {
    return null;
  }
}

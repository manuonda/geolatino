export type PlayResult = {
  questionId: string;
  guess: { lat: number; lng: number };
  answer: { lat: number; lng: number; name: string; story: string };
  distanceKm: number;
  rawScore: number;
  hintsUsed: number;
  multiplier: number;
  score: number;
  chip: "green" | "yellow" | "red";
  proof: string;
};

export async function submitGuess(
  questionId: string,
  guess: { lat: number; lng: number },
  hintsUsed: number,
) {
  const response = await fetch("/api/jugada", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId, guess, hintsUsed }),
  });
  if (!response.ok) {
    throw new Error("No se pudo validar la respuesta");
  }
  return (await response.json()) as PlayResult;
}

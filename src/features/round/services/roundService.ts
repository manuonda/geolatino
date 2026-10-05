export async function fetchRound() {
  const response = await fetch("/api/ronda");
  if (!response.ok) {
    throw new Error("No se pudo cargar la ronda");
  }
  return response.json();
}

export async function submitGuess(questionId: string, guess: { lat: number; lng: number }) {
  const response = await fetch("/api/jugada", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ questionId, guess }),
  });
  if (!response.ok) {
    throw new Error("No se pudo enviar la jugada");
  }
  return response.json();
}

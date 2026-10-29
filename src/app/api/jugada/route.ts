import { distanceKm } from "@/lib/haversine";
import { saveFirstPlay } from "@/lib/plays";
import { signProof } from "@/lib/proof";
import { findRoundQuestion } from "@/lib/questions";
import {
  applyHints,
  applyMultiplier,
  chipColor,
  MAX_HINTS,
  rawScoreFromDistanceKm,
} from "@/lib/score";
import { getSessionUserId } from "@/lib/supabase/server";
import { todayInBuenosAires, yesterdayInBuenosAires } from "@/lib/timezone";

type GuessBody = {
  questionId?: unknown;
  guess?: { lat?: unknown; lng?: unknown };
  hintsUsed?: unknown;
};

function isCoordinate(value: unknown, limit: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;
}

function clampHints(value: unknown): number {
  const hints = typeof value === "number" && Number.isFinite(value) ? Math.round(value) : 0;
  return Math.min(MAX_HINTS, Math.max(0, hints));
}

export async function POST(request: Request) {
  let body: GuessBody;
  try {
    body = (await request.json()) as GuessBody;
  } catch {
    return Response.json({ error: "El cuerpo no es JSON válido" }, { status: 400 });
  }

  const questionId = body.questionId;
  const lat = body.guess?.lat;
  const lng = body.guess?.lng;

  if (typeof questionId !== "string" || !isCoordinate(lat, 90) || !isCoordinate(lng, 180)) {
    return Response.json({ error: "questionId y guess son requeridos" }, { status: 400 });
  }

  // Se acepta la ronda de ayer: una ronda empezada a las 23:58 termina después de medianoche.
  let found;
  try {
    found = await findRoundQuestion(questionId, [todayInBuenosAires(), yesterdayInBuenosAires()]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "No se pudo validar la respuesta" }, { status: 503 });
  }
  if (!found) {
    return Response.json({ error: "Pregunta no encontrada" }, { status: 404 });
  }
  const { date, question } = found;

  const hintsUsed = clampHints(body.hintsUsed);
  const km = distanceKm({ lat, lng }, { lat: question.lat, lng: question.lng });
  const computed = {
    guess: { lat, lng },
    distanceKm: Math.round(km * 10) / 10,
    hintsUsed,
    rawScore: applyHints(rawScoreFromDistanceKm(km), hintsUsed),
  };
  const computedScore = applyMultiplier(computed.rawScore, question.orden).score;

  // Con sesión cuenta solo el primer intento: si ya había jugada, se responde con la guardada.
  const playerId = await getSessionUserId();
  const stored = playerId
    ? await saveFirstPlay({
        playerId,
        roundDate: date,
        questionId: question.id,
        ...computed,
        score: computedScore,
      })
    : null;

  const play = stored ?? { ...computed, score: computedScore };
  const { multiplier } = applyMultiplier(play.rawScore, question.orden);

  return Response.json({
    questionId: question.id,
    guess: play.guess,
    answer: {
      lat: question.lat,
      lng: question.lng,
      name: question.lugar,
      story: question.historia,
    },
    distanceKm: play.distanceKm,
    rawScore: play.rawScore,
    hintsUsed: play.hintsUsed,
    multiplier,
    score: play.score,
    chip: chipColor(play.rawScore),
    persisted: stored !== null,
    proof: signProof({
      date,
      questionId: question.id,
      guess: play.guess,
      score: play.score,
      anonymousId: "anon",
      expiresAt: date,
    }),
  });
}

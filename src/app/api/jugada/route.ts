import { distanceKm } from "@/lib/haversine";
import { signProof } from "@/lib/proof";
import { getQuestionById } from "@/lib/questions";
import {
  applyHints,
  applyMultiplier,
  chipColor,
  MAX_HINTS,
  rawScoreFromDistanceKm,
} from "@/lib/score";
import { todayInBuenosAires } from "@/lib/timezone";

type GuessBody = {
  questionId?: string;
  guess?: { lat?: number; lng?: number };
  hintsUsed?: number;
};

export async function POST(request: Request) {
  const body = (await request.json()) as GuessBody;
  const questionId = body.questionId;
  const lat = body.guess?.lat;
  const lng = body.guess?.lng;
  const hintsUsed = body.hintsUsed ?? 0;

  if (!questionId || lat == null || lng == null) {
    return Response.json({ error: "questionId y guess son requeridos" }, { status: 400 });
  }

  const question = getQuestionById(questionId);
  if (!question) {
    return Response.json({ error: "Pregunta no encontrada" }, { status: 404 });
  }

  const guess = { lat, lng };
  const km = distanceKm(guess, { lat: question.lat, lng: question.lng });
  const rawBeforeHints = rawScoreFromDistanceKm(km);
  const rawScore = applyHints(rawBeforeHints, hintsUsed);
  const { multiplier, score } = applyMultiplier(rawScore, question.orden);
  const date = todayInBuenosAires();

  return Response.json({
    questionId: question.id,
    guess,
    answer: {
      lat: question.lat,
      lng: question.lng,
      name: question.lugar,
      story: question.historia,
    },
    distanceKm: Math.round(km * 10) / 10,
    rawScore,
    hintsUsed: Math.min(MAX_HINTS, Math.max(0, Math.round(hintsUsed))),
    multiplier,
    score,
    chip: chipColor(rawScore),
    proof: signProof({
      date,
      questionId: question.id,
      guess,
      score,
      anonymousId: "anon",
      expiresAt: date,
    }),
  });
}

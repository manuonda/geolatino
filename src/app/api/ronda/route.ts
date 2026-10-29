import { getPublicRound } from "@/lib/questions";
import { todayInBuenosAires } from "@/lib/timezone";

export async function GET() {
  const date = todayInBuenosAires();
  const questions = await getPublicRound(date);

  if (questions === null) {
    return Response.json({ error: "No se pudo cargar la ronda" }, { status: 503 });
  }

  return Response.json({ date, questions });
}

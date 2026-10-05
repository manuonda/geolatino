import { getPublicRound } from "@/lib/questions";
import { todayInBuenosAires } from "@/lib/timezone";

export async function GET() {
  const date = todayInBuenosAires();

  return Response.json({
    date,
    questions: getPublicRound(date),
  });
}

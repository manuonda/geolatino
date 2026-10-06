import { PlayRound } from "@/features/round/components/PlayRound";
import { getPublicRound } from "@/lib/questions";
import { todayInBuenosAires } from "@/lib/timezone";

export default function JugarPage() {
  const round = getPublicRound(todayInBuenosAires());

  if (round.length === 0) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-night font-display text-gold">
        No hay pregunta para hoy.
      </main>
    );
  }

  return <PlayRound questions={round} />;
}

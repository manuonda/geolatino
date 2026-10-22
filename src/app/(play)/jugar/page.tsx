import { connection } from "next/server";
import { PlayRound } from "@/features/round/components/PlayRound";
import { getPublicRound } from "@/lib/questions";
import { todayInBuenosAires } from "@/lib/timezone";

export default async function JugarPage() {
  // La ronda depende de la fecha del pedido: sin esto la página se genera
  // una sola vez al compilar y muestra la ronda de ese día hasta el próximo despliegue.
  await connection();

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

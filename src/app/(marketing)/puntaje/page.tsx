import Link from "next/link";
import { GameTopBar } from "@/shared/components/GameMenu";
import { GameShell } from "@/shared/components/GameShell";

export default function PuntajePage() {
  return (
    <GameShell className="flex flex-col gap-6 px-3 pb-10 pt-3 sm:px-4 sm:pt-4">
      <GameTopBar />
      <div className="flex flex-col gap-6 px-2">
        <h1 className="font-display text-3xl text-gold">Cómo funciona el puntaje</h1>
        <p className="text-base leading-relaxed text-cream/90">
          Cada pregunta vale hasta 100 puntos según qué tan cerca toques: a menos de
          50 km sacás 100, y cada 700 km más de error perdés la mitad. Las últimas
          valen más (×2 y ×3). El máximo de la ronda es 1000. Podés pedir hasta 3
          pistas con Puppin, el mascota: tocá su burbuja como un chat y cada pista
          resta 15 puntos. Al validar ves tu pin, el lugar correcto y los kilómetros
          entre los dos. El relato de por qué se le dice así se revela al terminar las 5.
        </p>
        <p className="font-hud text-sm tabular-nums text-cream/80">
          50 km → 100 · 750 km → 50 · 1.450 km → 25 · 2.150 km → 13
        </p>
        <ul className="space-y-3 font-hud text-sm font-semibold tabular-nums">
          <li>
            <span className="inline-block h-4 w-4 border-[3px] border-night bg-chip-green align-middle" />{" "}
            80–100 verde
          </li>
          <li>
            <span className="inline-block h-4 w-4 border-[3px] border-night bg-chip-yellow align-middle" />{" "}
            50–79 amarillo
          </li>
          <li>
            <span className="inline-block h-4 w-4 border-[3px] border-night bg-card align-middle" />{" "}
            menos de 50 rojo
          </li>
        </ul>
        <Link
          href="/"
          className="font-sans text-sm font-semibold text-gold underline decoration-2 underline-offset-4"
        >
          Volver
        </Link>
      </div>
    </GameShell>
  );
}

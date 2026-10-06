import Link from "next/link";
import { GameMenu } from "@/shared/components/GameMenu";
import { Logo } from "@/shared/components/Logo";

export default function PuntajePage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 py-10">
      <header className="flex items-center justify-between gap-3">
        <Logo />
        <GameMenu compact />
      </header>
      <h1 className="font-display text-3xl text-gold">Cómo funciona el puntaje</h1>
      <p className="text-base leading-relaxed text-cream/90">
        Cada pregunta vale hasta 100 puntos según qué tan cerca toques. Las últimas
        valen más (×2 y ×3). El máximo de la ronda es 1000. Podés pedir hasta 3
        pistas con Puppin, el mascota: tocá su burbuja como un chat y cada pista
        resta 15 puntos. Al validar ves tu pin, el lugar correcto y los kilómetros
        entre los dos. El relato de por qué se le dice así se revela al terminar las 5.
      </p>
      <ul className="space-y-3 font-sans text-base">
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
        className="font-display text-base text-gold underline decoration-2 underline-offset-4"
      >
        Volver
      </Link>
    </main>
  );
}

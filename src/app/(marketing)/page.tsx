import Link from "next/link";
import { SessionStatus } from "@/features/auth/components/SessionStatus";
import GlobeMap from "@/features/round/components/GlobeMap";
import {
  blockButtonClass,
  blockButtonVariants,
} from "@/shared/components/Button";
import { GameMenu } from "@/shared/components/GameMenu";
import { Logo } from "@/shared/components/Logo";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const loginFailed = (await searchParams).error === "login";

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden">
      <GlobeMap className="absolute inset-0" />
      <div className="absolute inset-0 bg-night/45" />

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-between px-5 py-10 sm:py-14">
        <div className="flex w-full items-center justify-between">
          <GameMenu compact />
          <p className="font-display text-sm tracking-wider text-gold/80">RONDA DE HOY</p>
        </div>

        <div className="flex max-w-md flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-5 text-lg text-cream/90">
            Tocá en el mapa dónde pasó · 5 preguntas
          </p>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          <Link
            href="/jugar"
            className={`${blockButtonClass} ${blockButtonVariants.primary} w-full min-h-14 text-xl`}
          >
            Jugar la ronda de hoy
          </Link>
          <SessionStatus />
          {loginFailed ? (
            <p role="alert" className="text-center font-sans text-sm text-cream">
              No se pudo iniciar sesión. Probá de nuevo.
            </p>
          ) : null}
          <Link
            href="/puntaje"
            className="font-display text-base text-gold underline decoration-2 underline-offset-4"
          >
            Cómo funciona el puntaje
          </Link>
        </div>
      </div>
    </main>
  );
}

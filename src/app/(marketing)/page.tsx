import Link from "next/link";
import { SessionStatus } from "@/features/auth/components/SessionStatus";
import GlobeMap from "@/features/round/components/GlobeMap";
import {
  blockButtonClass,
  blockButtonVariants,
} from "@/shared/components/Button";
import { GameTopBar } from "@/shared/components/GameMenu";
import { GameShell } from "@/shared/components/GameShell";
import { Logo } from "@/shared/components/Logo";

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const loginFailed = (await searchParams).error === "login";

  return (
    <GameShell className="flex min-h-dvh flex-col overflow-hidden">
      <GlobeMap className="absolute inset-0" />
      <div className="absolute inset-0 bg-night/45" />

      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-between gap-8 px-3 pb-10 pt-3 sm:px-4 sm:pb-14 sm:pt-4">
        <GameTopBar />

        <div className="flex max-w-md flex-col items-center text-center">
          <Logo size="lg" />
          <p className="mt-5 font-hud text-sm font-semibold leading-relaxed tracking-wide text-cream/90">
            Juego diario de geografía deportiva
            <br />
            tocá en el mapa dónde pasó · 5 preguntas
          </p>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          <Link
            href="/jugar"
            className={`${blockButtonClass} ${blockButtonVariants.primary} min-h-14 w-full text-xl`}
          >
            Jugar la ronda de hoy
          </Link>
          <div className="flex w-full flex-col items-center gap-2 border-[3px] border-gold/40 bg-night/85 px-4 py-3 block-shadow">
            <SessionStatus />
            {loginFailed ? (
              <p role="alert" className="text-center font-sans text-sm text-cream">
                No se pudo iniciar sesión. Probá de nuevo.
              </p>
            ) : null}
            <Link
              href="/puntaje"
              className="font-sans text-sm font-semibold text-gold underline decoration-2 underline-offset-4"
            >
              Cómo funciona el puntaje
            </Link>
          </div>
        </div>
      </div>
    </GameShell>
  );
}

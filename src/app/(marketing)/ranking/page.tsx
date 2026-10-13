import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { SessionStatus } from "@/features/auth/components/SessionStatus";
import { getDailyRanking } from "@/lib/plays";
import { getSessionUserId } from "@/lib/supabase/server";
import { todayInBuenosAires } from "@/lib/timezone";
import { GameMenu } from "@/shared/components/GameMenu";
import { Logo } from "@/shared/components/Logo";

export const metadata: Metadata = {
  title: "Ranking de hoy · GeoLatino",
};

const ROUND_QUESTIONS = 5;

export default async function RankingPage() {
  // El ranking se lee con el cliente admin, que no usa cookies:
  // sin esto la página podría generarse una sola vez al compilar.
  await connection();

  const [rows, currentPlayerId] = await Promise.all([
    getDailyRanking(todayInBuenosAires()),
    getSessionUserId(),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col gap-6 px-5 py-10">
      <header className="flex items-center justify-between gap-3">
        <Logo />
        <GameMenu compact />
      </header>
      <h1 className="font-display text-3xl text-gold">Ranking de hoy</h1>

      {rows === null ? (
        <p className="text-base text-cream/90">
          No se pudo cargar el ranking. Probá de nuevo en un rato.
        </p>
      ) : rows.length === 0 ? (
        <p className="text-base text-cream/90">
          Todavía nadie jugó la ronda de hoy. Podés ser el primero.
        </p>
      ) : (
        <ol className="flex flex-col gap-2">
          {rows.map((row, index) => {
            const isCurrent = row.playerId === currentPlayerId;
            return (
              <li
                key={row.playerId}
                className={`flex items-center gap-3 border-[3px] bg-pitch px-4 py-3 ${
                  isCurrent ? "border-gold block-shadow" : "border-cream/30"
                }`}
              >
                <span className="w-8 font-display text-xl tabular-nums text-gold">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-sans text-base text-cream">
                  {row.displayName}
                  {isCurrent ? " (vos)" : ""}
                </span>
                <span className="font-sans text-sm tabular-nums text-cream/70">
                  {row.answered}/{ROUND_QUESTIONS}
                </span>
                <span className="w-14 text-right font-display text-xl tabular-nums text-gold">
                  {row.totalScore}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <SessionStatus next="/ranking" />

      <Link
        href="/"
        className="font-display text-base text-gold underline decoration-2 underline-offset-4"
      >
        Volver
      </Link>
    </main>
  );
}

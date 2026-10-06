"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScoreChips } from "@/features/results/components/ScoreChips";
import { ShareButton } from "@/features/results/components/ShareButton";
import { GameMenu } from "@/shared/components/GameMenu";
import { Logo } from "@/shared/components/Logo";
import { readRoundRecap, type RoundRecap } from "@/lib/round-storage";

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

export function RoundRecapView() {
  const [recap, setRecap] = useState<RoundRecap | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecap(readRoundRecap());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-night font-display text-gold">
        Cargando resultados…
      </main>
    );
  }

  if (!recap || recap.plays.length === 0) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-5">
        <p className="text-center font-display text-xl text-gold">
          Todavía no hay una ronda jugada.
        </p>
        <Link
          href="/jugar"
          className="font-display text-cream underline decoration-2 underline-offset-4"
        >
          Ir a jugar
        </Link>
      </main>
    );
  }

  const dateLabel = formatDate(recap.date);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-5 py-10">
      <header className="flex items-center justify-between gap-3">
        <Logo />
        <GameMenu compact />
      </header>
      <p className="font-sans text-sm text-gold">{dateLabel} · ronda cerrada</p>

      <section className="border-[3px] border-gold bg-pitch p-6 text-center block-shadow">
        <p className="font-display text-6xl text-gold tabular-nums">{recap.totalScore}</p>
        <p className="mt-1 font-sans text-lg tabular-nums text-cream/80">/ 1000</p>
        <div className="mt-6 flex justify-center">
          <ScoreChips chips={recap.plays.map((play) => play.chip)} />
        </div>
      </section>

      <section className="space-y-4">
        <p className="font-display text-base tracking-wider text-gold">
          POR QUÉ SE LE DICE ASÍ
        </p>
        {recap.plays.map((play, index) => (
          <article
            key={play.questionId}
            className="border-[3px] border-gold bg-pitch p-4 text-cream block-shadow"
          >
            <p className="font-sans text-sm font-semibold tabular-nums text-gold">
              {index + 1}/5 · {play.rawScore} × {play.multiplier} = {play.score} pts
              {play.hintsUsed > 0 ? ` · ${play.hintsUsed} pista${play.hintsUsed > 1 ? "s" : ""}` : ""}
            </p>
            <p className="mt-1 font-sans text-xs tabular-nums text-cream/70">{play.distanceKm} km</p>
            <p className="mt-3 font-display text-lg text-gold">{play.answer.name}</p>
            <p className="mt-2 font-sans text-sm leading-relaxed">{play.answer.story}</p>
          </article>
        ))}
      </section>

      <ShareButton score={recap.totalScore} dateLabel={dateLabel} />

      <Link
        href="/"
        className="text-center font-display text-base text-gold underline decoration-2 underline-offset-4"
      >
        Volvé mañana
      </Link>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ScoreChips } from "@/features/results/components/ScoreChips";
import { ShareButton } from "@/features/results/components/ShareButton";
import { GameTopBar } from "@/shared/components/GameMenu";
import { GameShell } from "@/shared/components/GameShell";
import { readRoundRecap, type RoundRecap } from "@/lib/round-storage";
import { formatRoundDate } from "@/lib/timezone";

const linkClass =
  "text-center font-sans text-sm font-semibold text-gold underline decoration-2 underline-offset-4";

export function RoundRecapView() {
  const [recap, setRecap] = useState<RoundRecap | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecap(readRoundRecap());
    setReady(true);
  }, []);

  return (
    <GameShell className="flex flex-col gap-8 px-3 pb-10 pt-3 sm:px-4 sm:pt-4">
      <GameTopBar />
      <div className="flex flex-1 flex-col gap-8 px-2">
        {!ready ? (
          <p className="m-auto font-hud text-sm font-bold tracking-widest text-gold">
            CARGANDO RESULTADOS…
          </p>
        ) : !recap || recap.plays.length === 0 ? (
          <div className="m-auto flex flex-col items-center gap-6">
            <p className="text-center font-display text-xl text-gold">
              Todavía no hay una ronda jugada.
            </p>
            <Link href="/jugar" className={linkClass}>
              Ir a jugar
            </Link>
          </div>
        ) : (
          <RecapContent recap={recap} />
        )}
      </div>
    </GameShell>
  );
}

function RecapContent({ recap }: { recap: RoundRecap }) {
  const dateLabel = formatRoundDate(recap.date);
  const inRanking = recap.plays.some((play) => play.persisted);

  return (
    <>
      <p className="font-hud text-xs font-bold tracking-[0.25em] text-gold">
        {dateLabel.toUpperCase()} · RONDA CERRADA
      </p>

      <section className="border-[3px] border-gold bg-pitch p-6 text-center block-shadow">
        <p className="font-hud text-[11px] font-bold tracking-[0.25em] text-gold/80">SCORE</p>
        <p className="mt-1 font-hud text-6xl font-extrabold tabular-nums text-gold">
          {recap.totalScore}
        </p>
        <p className="mt-1 font-hud text-base tabular-nums text-cream/80">/ 1000</p>
        <div className="mt-6 flex justify-center">
          <ScoreChips chips={recap.plays.map((play) => play.chip)} />
        </div>
      </section>

      <section className="space-y-4">
        <p className="font-hud text-xs font-bold tracking-[0.25em] text-gold">
          POR QUÉ SE LE DICE ASÍ
        </p>
        {recap.plays.map((play, index) => (
          <article
            key={play.questionId}
            className="border-[3px] border-gold bg-pitch p-4 text-cream block-shadow"
          >
            <p className="font-hud text-sm font-bold tabular-nums text-gold">
              {index + 1}/5 · {play.rawScore} × {play.multiplier} = {play.score} pts
              {play.hintsUsed > 0 ? ` · ${play.hintsUsed} pista${play.hintsUsed > 1 ? "s" : ""}` : ""}
            </p>
            <p className="mt-1 font-hud text-xs tabular-nums text-cream/70">{play.distanceKm} km</p>
            <p className="mt-3 font-sans text-lg font-bold text-gold">{play.answer.name}</p>
            <p className="mt-2 font-sans text-sm leading-relaxed">{play.answer.story}</p>
          </article>
        ))}
      </section>

      <ShareButton score={recap.totalScore} dateLabel={dateLabel} />

      {inRanking ? null : (
        <p className="text-center font-sans text-sm text-cream/80">
          Esta ronda no entró al ranking porque jugaste sin sesión.{" "}
          <a
            href="/auth/login?next=/ranking"
            className="text-gold underline decoration-2 underline-offset-4"
          >
            Entrá con Google
          </a>{" "}
          para competir en la próxima.
        </p>
      )}

      <Link href="/ranking" className={linkClass}>
        Ver ranking
      </Link>

      <Link href="/" className={linkClass}>
        Volvé mañana
      </Link>
    </>
  );
}

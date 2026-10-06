"use client";

import { HintChat } from "@/features/round/components/HintChat";
import { RevealCard } from "@/features/reveal/components/RevealCard";
import { Button } from "@/shared/components/Button";
import { GameMenu } from "@/shared/components/GameMenu";
import { MAX_HINTS, stakeForQuestion } from "@/lib/score";
import type { PlayResult } from "@/features/round/services/roundService";

type PlayHudProps = {
  questionText: string;
  questionIndex: number;
  questionTotal: number;
  score: number;
  hasGuess: boolean;
  validating: boolean;
  error: string | null;
  hints: string[];
  hintsUsed: number;
  result: PlayResult | null;
  onHint: () => void;
  onValidate: () => void;
  onNext: () => void;
};

export function PlayHud({
  questionText,
  questionIndex,
  questionTotal,
  score,
  hasGuess,
  validating,
  error,
  hints,
  hintsUsed,
  result,
  onHint,
  onValidate,
  onNext,
}: PlayHudProps) {
  const order = Math.min(5, Math.max(1, questionIndex)) as 1 | 2 | 3 | 4 | 5;
  const stake = stakeForQuestion(order);
  const availableHints = (hints ?? []).slice(0, MAX_HINTS);
  const canAskHint = !result && hintsUsed < availableHints.length && !validating;
  const isLast = questionIndex >= questionTotal;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <header className="pointer-events-auto mx-auto w-full max-w-2xl space-y-2 p-3 sm:p-4">
        <div className="flex items-stretch gap-2">
          <GameMenu compact />
          <div className="flex min-w-[5.5rem] flex-col items-center justify-center border-[3px] border-gold bg-night px-3 py-1 text-gold block-shadow">
            <span className="font-sans text-[10px] font-bold tracking-[0.2em]">SCORE</span>
            <span className="font-display text-3xl leading-none tabular-nums">{score}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center border-[3px] border-gold/70 bg-pitch px-3 py-2 text-cream block-shadow">
            <p className="font-sans text-base font-semibold tabular-nums text-gold">
              {questionIndex}/{questionTotal}
              <span className="ml-2 font-medium text-cream">esta vale ×{stake.multiplier}</span>
            </p>
            <p className="truncate font-sans text-xs text-cream/80">
              Hasta {stake.maxPoints} pts
            </p>
          </div>
        </div>
        <article className="border-[3px] border-gold bg-pitch p-4 text-cream block-shadow">
          <p className="mb-1 font-display text-sm tracking-wider text-gold">RELATO</p>
          <p className="font-sans text-lg leading-snug sm:text-xl">{questionText}</p>
        </article>
      </header>

      <div className="relative flex-1">
        {!result && availableHints.length > 0 && (
          <div className="pointer-events-auto absolute right-3 bottom-1 z-20">
            <HintChat
              key={questionIndex}
              hints={availableHints}
              hintsUsed={hintsUsed}
              canAsk={canAskHint}
              onAsk={onHint}
            />
          </div>
        )}
      </div>

      <footer className="pointer-events-auto mx-auto w-full max-w-lg p-3 pb-5 sm:p-4">
        <div className="space-y-3 border-[3px] border-gold bg-pitch p-3 block-shadow">
          {result ? (
            <>
              <RevealCard
                score={result.score}
                multiplier={result.multiplier}
                rawScore={result.rawScore}
                distanceKm={result.distanceKm}
                placeName={result.answer.name}
              />
              <p className="text-center font-sans text-xs text-cream/80">
                Oro: tu toque · Verde: el lugar. La historia completa va al final.
              </p>
              <Button className="w-full" onClick={onNext}>
                {isLast ? "Ver resultados" : "Siguiente pregunta"}
              </Button>
            </>
          ) : (
            <>
              <p className="text-center font-sans text-sm text-cream">
                {validating
                  ? "Midiendo la distancia al lugar…"
                  : hasGuess
                    ? "Pin marcado. Validá para ver dónde estaba."
                    : "Tocá el globo para marcar dónde pasó."}
              </p>
              {error && (
                <p className="text-center font-sans text-sm text-chip-yellow">{error}</p>
              )}
              <Button
                className="w-full"
                disabled={!hasGuess || validating}
                onClick={onValidate}
              >
                {validating ? "Validando…" : "Validar pregunta"}
              </Button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

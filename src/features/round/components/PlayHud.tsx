"use client";

import { HintChat } from "@/features/round/components/HintChat";
import { RevealCard } from "@/features/reveal/components/RevealCard";
import { Button } from "@/shared/components/Button";
import { GameTopBar } from "@/shared/components/GameMenu";
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
  const answered = questionIndex - 1 + (result ? 1 : 0);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
      <header className="pointer-events-auto w-full space-y-2 p-2 sm:p-3">
        <GameTopBar />
        <div className="flex items-stretch gap-2 border-[3px] border-gold bg-night/95 p-2 block-shadow">
          <div className="flex min-w-[4.75rem] flex-col items-center justify-center border-[3px] border-gold/80 px-2 py-1 text-gold">
            <span className="font-hud text-[10px] font-bold tracking-[0.25em]">SCORE</span>
            <span className="font-hud text-2xl font-extrabold leading-none tabular-nums">
              {String(score).padStart(3, "0")}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
            <div className="flex items-center gap-2 bg-gold px-2 py-1 font-hud text-[11px] font-bold tabular-nums text-night">
              <span className="whitespace-nowrap">
                PREGUNTA {questionIndex} DE {questionTotal}
              </span>
              <ol
                aria-label={`${answered} de ${questionTotal} respondidas`}
                className="flex flex-1 gap-1"
              >
                {Array.from({ length: questionTotal }, (_, step) => (
                  <li
                    key={step}
                    className={`h-2 flex-1 border-[2px] border-night ${
                      step < answered
                        ? "bg-night"
                        : step === questionIndex - 1
                          ? "bg-night/35"
                          : "bg-gold"
                    }`}
                  />
                ))}
              </ol>
              <span className="whitespace-nowrap">
                ×{stake.multiplier} · {stake.maxPoints} pts
              </span>
            </div>
            <p className="px-1 font-sans text-base leading-snug text-cream sm:text-[17px]">
              {questionText}
            </p>
          </div>
        </div>
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

      <footer className="pointer-events-auto mx-auto w-full max-w-lg p-2 pb-4 sm:p-3 sm:pb-5">
        <div className="space-y-2 border-[3px] border-gold bg-pitch/95 p-2.5 block-shadow">
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

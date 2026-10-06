"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import GlobeMap from "@/features/round/components/GlobeMap";
import { PlayHud } from "@/features/round/components/PlayHud";
import {
  submitGuess,
  type PlayResult,
} from "@/features/round/services/roundService";
import { saveRoundRecap } from "@/lib/round-storage";
import { MAX_HINTS } from "@/lib/score";
import { todayInBuenosAires } from "@/lib/timezone";
import type { PublicQuestion } from "@/types/question";

type PlayRoundProps = {
  questions: PublicQuestion[];
};

export function PlayRound({ questions }: PlayRoundProps) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [guess, setGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [plays, setPlays] = useState<PlayResult[]>([]);
  const [result, setResult] = useState<PlayResult | null>(null);
  const [pinKey, setPinKey] = useState(0);

  const question = questions?.[index];
  if (!question) {
    return (
      <main className="flex h-dvh items-center justify-center bg-night font-display text-gold">
        No hay pregunta para hoy.
      </main>
    );
  }

  function askHint() {
    const max = Math.min(MAX_HINTS, question.pistas?.length ?? 0);
    if (result || hintsUsed >= max || validating) return;
    setHintsUsed((used) => used + 1);
  }

  async function validate() {
    if (!guess || validating || result) return;
    setValidating(true);
    setError(null);
    try {
      const play = await submitGuess(question.id, guess, hintsUsed);
      setResult(play);
      setPlays((current) => [...current, play]);
      setScore((current) => current + play.score);
    } catch {
      setError("No se pudo validar. Probá de nuevo.");
    } finally {
      setValidating(false);
    }
  }

  function goNext() {
    if (!result) return;
    const isLast = index >= questions.length - 1;
    const nextPlays = plays;
    if (isLast) {
      saveRoundRecap({
        date: todayInBuenosAires(),
        totalScore: score,
        plays: nextPlays,
      });
      router.push("/resultados");
      return;
    }

    setResult(null);
    setGuess(null);
    setHintsUsed(0);
    setError(null);
    setIndex((current) => current + 1);
    setPinKey((key) => key + 1);
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-night">
      <GlobeMap
        className="absolute inset-0 h-full w-full"
        allowGuess={!validating && !result}
        resetKey={pinKey}
        reveal={
          result
            ? { guess: result.guess, answer: result.answer }
            : null
        }
        onGuess={setGuess}
      />
      <PlayHud
        questionText={question.pregunta}
        questionIndex={question.orden}
        questionTotal={questions.length}
        score={score}
        hasGuess={guess !== null}
        validating={validating}
        error={error}
        hints={question.pistas}
        hintsUsed={hintsUsed}
        result={result}
        onHint={askHint}
        onValidate={() => void validate()}
        onNext={goNext}
      />
    </main>
  );
}

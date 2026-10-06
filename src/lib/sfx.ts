const HINT_RATES = [1, 1.12, 1.25] as const;

/** Coin arcade al desbloquear una pista. La 2 y la 3 suenan un poco más agudas. */
export function playHintSound(hintNumber: number) {
  const index = Math.min(HINT_RATES.length, Math.max(1, hintNumber)) - 1;
  const audio = new Audio("/sfx/puppin-hint.wav");
  audio.playbackRate = HINT_RATES[index];
  void audio.play().catch(() => {
    /* El navegador puede bloquear audio si no hubo click. */
  });
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Puppin } from "@/shared/components/Puppin";
import { HINT_PENALTY } from "@/lib/score";
import { playHintSound } from "@/lib/sfx";

type HintChatProps = {
  hints: string[];
  hintsUsed: number;
  canAsk: boolean;
  onAsk: () => void;
};

export function HintChat({ hints, hintsUsed, canAsk, onAsk }: HintChatProps) {
  const [open, setOpen] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const remaining = Math.max(0, hints.length - hintsUsed);

  useEffect(() => {
    if (!open) return;
    const thread = threadRef.current;
    if (!thread) return;
    thread.scrollTop = thread.scrollHeight;
  }, [hintsUsed, open]);

  function askHint() {
    if (!canAsk) return;
    playHintSound(hintsUsed + 1);
    onAsk();
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {open && (
        <div className="w-[min(18.5rem,calc(100vw-1.5rem))] overflow-hidden border-[3px] border-gold bg-night block-shadow">
          <header className="flex items-center gap-2 border-b-[3px] border-gold/50 bg-pitch px-3 py-2">
            <Puppin size={36} />
            <div className="min-w-0">
              <p className="font-display text-sm leading-none text-gold">Puppin</p>
              <p className="font-sans text-xs text-cream/75">te suelta una pista</p>
            </div>
          </header>

          <div
            ref={threadRef}
            className="flex max-h-56 flex-col gap-2 overflow-y-auto p-3"
          >
            <ChatBubble>
              ¡Hola! Soy Puppin. Si te trabás, pedime una pista. Cada una resta{" "}
              {HINT_PENALTY} puntos.
            </ChatBubble>
            {hints.slice(0, hintsUsed).map((hint, index) => (
              <div key={hint} className="flex flex-col gap-2">
                <ChatBubble mine>
                  {index === 0 ? "¡Dame una pista!" : "Otra pista, Puppin"}
                </ChatBubble>
                <ChatBubble>{hint}</ChatBubble>
              </div>
            ))}
            {hintsUsed >= hints.length && hints.length > 0 && (
              <ChatBubble>Ya te di las {hints.length} pistas. ¡A tocar el mapa!</ChatBubble>
            )}
          </div>

          <div className="border-t-[3px] border-gold/40 p-2">
            <button
              type="button"
              disabled={!canAsk}
              onClick={askHint}
              className="flex w-full items-center justify-center gap-2 border-[3px] border-night bg-gold px-3 py-2 font-sans text-sm font-semibold text-night block-shadow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {canAsk
                ? `Pedime una pista · −${HINT_PENALTY}`
                : remaining === 0
                  ? "Sin más pistas"
                  : "Esperá un toque"}
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        {!open && remaining > 0 && (
          <p className="absolute -top-8 right-0 whitespace-nowrap border-[2px] border-night bg-cream px-2 py-0.5 font-sans text-xs font-bold text-night block-shadow">
            ¿Pista?
          </p>
        )}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={`relative flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-night bg-gold block-shadow ${
            remaining > 0 && !open ? "puppin-bob" : ""
          }`}
          aria-label={open ? "Cerrar chat de Puppin" : "Abrir chat de Puppin para pedir pistas"}
        >
          <Puppin size={54} />
          {remaining > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center border-[2px] border-night bg-card px-1 font-sans text-xs font-bold tabular-nums text-cream">
              {remaining}
            </span>
          )}
        </button>
        <p className="mt-1 text-center font-display text-[10px] leading-none text-gold">
          Puppin
        </p>
      </div>
    </div>
  );
}

function ChatBubble({
  children,
  mine = false,
}: {
  children: ReactNode;
  mine?: boolean;
}) {
  return (
    <p
      className={`max-w-[92%] px-3 py-2 font-sans text-sm leading-snug ${
        mine
          ? "ml-auto bg-gold text-night"
          : "mr-auto bg-pitch text-cream"
      } border-[2px] border-night`}
    >
      {children}
    </p>
  );
}

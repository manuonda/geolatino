"use client";

import type { ChipColor } from "@/lib/score";

const chipClass: Record<ChipColor, string> = {
  green: "bg-chip-green",
  yellow: "bg-chip-yellow",
  red: "bg-card",
};

type ScoreChipsProps = {
  chips: ChipColor[];
};

export function ScoreChips({ chips }: ScoreChipsProps) {
  return (
    <div className="flex gap-2" aria-label="Fichas de la ronda">
      {chips.map((color, index) => (
        <span
          key={`${color}-${index}`}
          className={`h-8 w-8 border-[3px] border-night block-shadow ${chipClass[color]}`}
        />
      ))}
    </div>
  );
}

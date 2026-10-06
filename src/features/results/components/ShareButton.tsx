"use client";

import { Button } from "@/shared/components/Button";

type ShareButtonProps = {
  score: number;
  dateLabel: string;
};

export function ShareButton({ score, dateLabel }: ShareButtonProps) {
  const text = `GeoLatino · ${dateLabel}
${score}/1000
geolatino.app`;

  async function share() {
    if (navigator.share) {
      await navigator.share({ text });
      return;
    }
    await navigator.clipboard.writeText(text);
  }

  return (
    <Button className="w-full" onClick={() => void share()}>
      Compartir
    </Button>
  );
}

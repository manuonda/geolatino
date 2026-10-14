type RevealCardProps = {
  score: number;
  multiplier: number;
  rawScore: number;
  distanceKm: number;
  placeName: string;
  story?: string;
};

export function RevealCard({
  score,
  multiplier,
  rawScore,
  distanceKm,
  placeName,
  story,
}: RevealCardProps) {
  return (
    <article className="border-[3px] border-gold bg-pitch p-4 text-cream block-shadow">
      <p className="font-hud text-sm font-bold tabular-nums text-gold">
        {distanceKm} km · {rawScore} × {multiplier} = {score} pts
      </p>
      <p className="mt-2 font-sans text-lg font-bold text-gold">{placeName}</p>
      {story ? <p className="mt-2 font-sans text-sm leading-relaxed">{story}</p> : null}
    </article>
  );
}

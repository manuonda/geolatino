import type { HistoryDay } from "@/lib/stats";
import { formatRoundDate } from "@/lib/timezone";

const MAX_ROUND_SCORE = 1000;

function describe(day: HistoryDay) {
  if (day.score === null) return `${formatRoundDate(day.date)}: no jugaste`;
  const rank = day.rank !== null ? ` · puesto ${day.rank} de ${day.players}` : "";
  return `${formatRoundDate(day.date)}: ${day.score} puntos${rank}`;
}

/** Puntaje de cada ronda de los últimos 30 días. Los días sin jugar quedan como una marca baja. */
export function HistoryChart({ history }: { history: HistoryDay[] }) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="font-hud text-xs font-bold tracking-widest text-gold">
        ÚLTIMOS {history.length} DÍAS
      </figcaption>
      <div className="relative border-b-2 border-cream/30">
        <span className="absolute -top-1 right-0 font-hud text-[10px] text-cream/50">1000</span>
        <ol className="flex h-36 items-end gap-[2px] pt-3" aria-hidden="true">
          {history.map((day) => {
            const height = day.score === null ? 0 : Math.max(2, (day.score / MAX_ROUND_SCORE) * 100);
            return (
              <li key={day.date} className="group relative flex h-full flex-1 items-end" title={describe(day)}>
                {day.score === null ? (
                  <span className="block h-[2px] w-full bg-cream/15" />
                ) : (
                  <span
                    className="block w-full rounded-t-[4px] bg-gold group-hover:bg-cream"
                    style={{ height: `${height}%` }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
      <div className="flex justify-between font-hud text-[10px] text-cream/60">
        <span>{formatRoundDate(history[0].date)}</span>
        <span>hoy</span>
      </div>
      <details className="text-sm text-cream/80">
        <summary className="cursor-pointer font-hud text-xs text-cream/70">Ver como tabla</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr className="font-hud text-xs text-cream/60">
              <th className="py-1 font-normal">Día</th>
              <th className="py-1 font-normal">Puntos</th>
              <th className="py-1 font-normal">Puesto</th>
            </tr>
          </thead>
          <tbody>
            {history
              .filter((day) => day.score !== null)
              .map((day) => (
                <tr key={day.date} className="border-t border-cream/10 tabular-nums">
                  <td className="py-1">{formatRoundDate(day.date)}</td>
                  <td className="py-1">{day.score}</td>
                  <td className="py-1">{day.rank !== null ? `${day.rank} de ${day.players}` : "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { HistoryChart } from "@/features/profile/components/HistoryChart";
import { getCurrentPlayer } from "@/lib/players";
import { getPlayerStats } from "@/lib/stats";
import { todayInBuenosAires, yesterdayInBuenosAires } from "@/lib/timezone";
import { GameTopBar } from "@/shared/components/GameMenu";
import { GameShell } from "@/shared/components/GameShell";

export const metadata: Metadata = {
  title: "Mis estadísticas · GeoLatino",
};

function Tile({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-[3px] border-cream/25 bg-pitch px-3 py-2">
      <span className="font-hud text-2xl font-extrabold tabular-nums text-cream">{value}</span>
      <span className="text-sm text-cream/80">{label}</span>
      {hint && <span className="text-xs text-cream/60">{hint}</span>}
    </div>
  );
}

const fmt = (value: number | null, suffix = "") => (value === null ? "—" : `${value.toLocaleString("es-AR")}${suffix}`);

export default async function ProfilePage() {
  // Depende de la sesión y de la fecha del pedido.
  await connection();

  const player = await getCurrentPlayer();
  if (!player) redirect("/auth/login?next=/perfil");

  const stats = await getPlayerStats(player.id, todayInBuenosAires(), yesterdayInBuenosAires());

  return (
    <GameShell className="flex flex-col gap-6 px-3 pb-10 pt-3 sm:px-4 sm:pt-4">
      <GameTopBar />
      <div className="flex flex-col gap-6 px-2">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-3xl text-gold">Mis estadísticas</h1>
          <p className="text-cream/80">{player.displayName}</p>
        </div>

        {stats === null ? (
          <p>No se pudieron cargar tus estadísticas. Probá de nuevo en un rato.</p>
        ) : stats.roundsPlayed === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-cream/90">Todavía no jugaste ninguna ronda con tu cuenta.</p>
            <Link
              href="/jugar"
              className="border-[3px] border-night bg-gold px-4 py-2 font-hud text-sm font-bold text-night block-shadow hover:bg-cream"
            >
              Jugar la ronda de hoy
            </Link>
          </div>
        ) : (
          <>
            <section aria-label="Racha" className="grid grid-cols-2 gap-3">
              <div className="flex flex-col border-[3px] border-gold bg-pitch px-4 py-3 block-shadow">
                <span className="font-hud text-4xl font-extrabold tabular-nums text-gold">{stats.streak.current}</span>
                <span className="text-sm">{stats.streak.current === 1 ? "día seguido" : "días seguidos"}</span>
                <span className="text-xs text-cream/60">Racha actual</span>
              </div>
              <div className="flex flex-col border-[3px] border-cream/25 bg-pitch px-4 py-3">
                <span className="font-hud text-4xl font-extrabold tabular-nums">{stats.streak.best}</span>
                <span className="text-sm">{stats.streak.best === 1 ? "día" : "días"}</span>
                <span className="text-xs text-cream/60">Mejor racha</span>
              </div>
            </section>

            <section aria-label="Totales" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Tile value={fmt(stats.roundsPlayed)} label="Rondas jugadas" />
              <Tile value={fmt(stats.avgRoundScore)} label="Promedio por ronda" hint="de 1000" />
              <Tile value={fmt(stats.bestScore)} label="Mejor ronda" />
              <Tile value={stats.bestRank === null ? "—" : `#${stats.bestRank}`} label="Mejor puesto" />
              <Tile
                value={fmt(stats.hits)}
                label="Aciertos"
                hint={`de ${stats.questionsAnswered} respuestas · ${stats.perfect} perfectas`}
              />
              <Tile
                value={fmt(stats.avgDistanceKm, " km")}
                label="Distancia promedio"
                hint={`Pistas por pregunta: ${fmt(stats.avgHints)}`}
              />
            </section>

            <HistoryChart history={stats.history} />

            {stats.countries.length > 0 && (
              <section className="flex flex-col gap-2">
                <h2 className="font-hud text-xs font-bold tracking-widest text-gold">POR PAÍS</h2>
                <ul className="flex flex-col gap-1">
                  {stats.countries.map((c) => (
                    <li key={c.country} className="flex items-center gap-3 text-sm">
                      <span className="w-8 font-hud font-bold">{c.country}</span>
                      <span className="h-2 flex-1 bg-cream/15">
                        <span
                          className="block h-full rounded-r-[4px] bg-gold"
                          style={{ width: `${(c.hits / c.answered) * 100}%` }}
                        />
                      </span>
                      <span className="w-28 text-right tabular-nums text-cream/80">
                        {c.hits} de {c.answered} aciertos
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </GameShell>
  );
}

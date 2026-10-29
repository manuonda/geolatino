import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { STATUS_LABEL, StatusBadge } from "@/features/admin/components/StatusBadge";
import { leakedPlaceWords } from "@/features/admin/questionSchema";
import { QUESTION_STATUSES, listQuestions, type QuestionStatus } from "@/lib/questions-admin";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

export default async function AdminQuestionsPage({ searchParams }: PageProps<"/admin/preguntas">) {
  // El layout también controla, pero layout y página se renderizan en paralelo.
  await requireAdmin();
  const params = await searchParams;
  const status = first(params.estado);
  const country = first(params.pais);
  const search = first(params.q);
  const unassigned = first(params.sinDia) === "1";

  const questions = await listQuestions({
    status: QUESTION_STATUSES.includes(status as QuestionStatus) ? (status as QuestionStatus) : undefined,
    country: /^[a-zA-Z]{2}$/.test(country) ? country : undefined,
    search: search || undefined,
    unassigned,
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-3xl text-gold">Preguntas</h1>
        <Link
          href="/admin/preguntas/nueva"
          className="border-[3px] border-night bg-gold px-3 py-1.5 font-hud text-sm font-bold text-night block-shadow hover:bg-cream"
        >
          + Nueva pregunta
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3 border-[3px] border-cream/20 bg-pitch p-3 text-sm">
        <label className="flex flex-col gap-1">
          Estado
          <select name="estado" defaultValue={status} className="admin-input">
            <option value="">Todos</option>
            {QUESTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          País
          <input name="pais" defaultValue={country} maxLength={2} placeholder="AR" className="admin-input w-20 uppercase" />
        </label>
        <label className="flex flex-col gap-1">
          Buscar
          <input name="q" defaultValue={search} placeholder="Lugar o acertijo" className="admin-input" />
        </label>
        <label className="flex items-center gap-2 pb-2">
          <input type="checkbox" name="sinDia" value="1" defaultChecked={unassigned} />
          Sin día asignado
        </label>
        <button type="submit" className="border-[3px] border-cream/40 px-3 py-1.5 font-hud font-bold hover:border-gold hover:text-gold">
          Filtrar
        </button>
      </form>

      {questions === null ? (
        <p>No se pudieron cargar las preguntas. Probá de nuevo en un rato.</p>
      ) : questions.length === 0 ? (
        <p className="text-cream/80">No hay preguntas con estos filtros.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {questions.map((q) => {
            const leaks = leakedPlaceWords(q.placeName, [q.prompt, ...q.hints]);
            return (
              <li key={q.id}>
                <Link
                  href={`/admin/preguntas/${encodeURIComponent(q.id)}`}
                  className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-[3px] border-cream/20 bg-pitch px-3 py-2 hover:border-gold sm:grid-cols-[6rem_1fr_auto_8rem]"
                >
                  <span className="font-hud text-xs text-gold">{q.id}</span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{q.placeName}</span>
                    <span className="block truncate text-sm text-cream/70">{q.prompt}</span>
                    {leaks.length > 0 && (
                      <span className="block text-xs text-gold">⚠ Menciona: {leaks.join(", ")}</span>
                    )}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-hud text-xs text-cream/70">{q.countryCode}</span>
                    <StatusBadge status={q.status} />
                  </span>
                  <span className="font-hud text-xs tabular-nums text-cream/70">
                    {q.roundDate ? `${q.roundDate} · #${q.position}` : "sin día"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

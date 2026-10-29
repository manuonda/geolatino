import { requireAdmin } from "@/lib/admin";
import Link from "next/link";
import { ActionForm } from "@/features/admin/components/ActionForm";
import { missingDays, type CalendarDay } from "@/features/admin/calendar";
import { getCalendar, listQuestions, type AdminQuestion } from "@/lib/questions-admin";
import { formatRoundDate, todayInBuenosAires } from "@/lib/timezone";
import { assignQuestionAction } from "../preguntas/actions";

const DAYS = 14;

const STATE_STYLE: Record<CalendarDay["state"], { border: string; label: string }> = {
  complete: { border: "border-chip-green", label: "Completo" },
  incomplete: { border: "border-gold", label: "Incompleto" },
  empty: { border: "border-card", label: "Vacío" },
};

export default async function CalendarPage() {
  // El layout también controla, pero layout y página se renderizan en paralelo.
  await requireAdmin();
  const today = todayInBuenosAires();
  const [calendar, available] = await Promise.all([
    getCalendar(today, DAYS),
    listQuestions({ status: "approved", unassigned: true }),
  ]);

  if (calendar === null || available === null) {
    return <p>No se pudo cargar el calendario. Probá de nuevo en un rato.</p>;
  }

  const missing = missingDays(calendar);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-3xl text-gold">Calendario</h1>
      <p className="text-sm text-cream/80">
        Próximos {DAYS} días. Un día está completo con 5 preguntas aprobadas. Hay {available.length}{" "}
        {available.length === 1 ? "pregunta aprobada" : "preguntas aprobadas"} sin día.
      </p>

      {missing.length > 0 && (
        <p role="status" className="border-[3px] border-gold bg-pitch px-3 py-2 text-sm">
          ⚠ Faltan completar {missing.length} de los próximos 7 días: {missing.map(formatRoundDate).join(", ")}.
        </p>
      )}

      <ol className="grid gap-3 sm:grid-cols-2">
        {calendar.map((day) => (
          <li key={day.date} className={`flex flex-col gap-2 border-[3px] bg-pitch p-3 ${STATE_STYLE[day.state].border}`}>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-hud text-sm font-bold">
                {formatRoundDate(day.date)}
                {day.date === today ? " · hoy" : ""}
              </h2>
              <span className="font-hud text-xs text-cream/70">{STATE_STYLE[day.state].label}</span>
            </div>
            <ol className="flex flex-col gap-1">
              {day.slots.map((slot, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <span className="w-5 font-hud text-xs text-gold">{index + 1}</span>
                  {slot ? (
                    <Link href={`/admin/preguntas/${encodeURIComponent(slot.id)}`} className="min-w-0 flex-1 truncate hover:text-gold">
                      {slot.placeName}
                      {slot.status !== "approved" && <span className="ml-1 text-xs text-gold">(sin aprobar)</span>}
                    </Link>
                  ) : (
                    <EmptySlot date={day.date} position={index + 1} available={available} />
                  )}
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </div>
  );
}

function EmptySlot({ date, position, available }: { date: string; position: number; available: AdminQuestion[] }) {
  if (available.length === 0) {
    return <span className="text-cream/50">vacío</span>;
  }
  return (
    <ActionForm action={assignQuestionAction} submitLabel="Asignar" tone="plain" className="flex-1 !flex-row items-center">
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="position" value={position} />
      <input type="hidden" name="returnTo" value="/admin/calendario" />
      <select name="id" className="admin-input min-w-0 flex-1 text-sm" required defaultValue="">
        <option value="" disabled>
          Elegir pregunta…
        </option>
        {available.map((q) => (
          <option key={q.id} value={q.id}>
            {q.placeName} · {q.countryCode} · dif. {q.difficulty}
          </option>
        ))}
      </select>
    </ActionForm>
  );
}

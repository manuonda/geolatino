export const SLOTS_PER_DAY = 5;
/** Días hacia adelante que tienen que estar completos para no mostrar el aviso. */
export const DAYS_AHEAD_REQUIRED = 7;

export type SlotQuestion = { id: string; placeName: string; status: string; position: number };

export type CalendarDay = {
  date: string;
  slots: (SlotQuestion | null)[];
  state: "complete" | "incomplete" | "empty";
};

/** Suma días a una fecha YYYY-MM-DD sin pasar por zonas horarias. */
export function addDays(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Completo: los 5 lugares con preguntas aprobadas. Vacío: ninguna pregunta. */
export function dayState(slots: (SlotQuestion | null)[]): CalendarDay["state"] {
  const filled = slots.filter((slot): slot is SlotQuestion => slot !== null);
  if (filled.length === 0) return "empty";
  if (filled.length === SLOTS_PER_DAY && filled.every((slot) => slot.status === "approved")) {
    return "complete";
  }
  return "incomplete";
}

/** Arma los días desde `from`, con sus 5 lugares, a partir de las preguntas con fecha. */
export function buildCalendar(
  from: string,
  days: number,
  questions: (SlotQuestion & { roundDate: string })[],
): CalendarDay[] {
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(from, i);
    const slots: (SlotQuestion | null)[] = Array(SLOTS_PER_DAY).fill(null);
    for (const q of questions) {
      if (q.roundDate === date && q.position >= 1 && q.position <= SLOTS_PER_DAY) {
        slots[q.position - 1] = { id: q.id, placeName: q.placeName, status: q.status, position: q.position };
      }
    }
    return { date, slots, state: dayState(slots) };
  });
}

/** Días entre hoy y los próximos 6 que no están completos. Vacío = no hace falta aviso. */
export function missingDays(calendar: CalendarDay[]): string[] {
  return calendar
    .slice(0, DAYS_AHEAD_REQUIRED)
    .filter((day) => day.state !== "complete")
    .map((day) => day.date);
}

export const ROUND_TIMEZONE = "America/Argentina/Buenos_Aires";

/** Fecha de la ronda (YYYY-MM-DD) en zona de Buenos Aires.
 *  La ronda es la misma para todos: no usar GPS ni el timezone del navegador. */
export function todayInBuenosAires(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ROUND_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Fecha de la ronda anterior. Argentina no tiene horario de verano: restar 24 h alcanza. */
export function yesterdayInBuenosAires(now = new Date()): string {
  return todayInBuenosAires(new Date(now.getTime() - DAY_MS));
}

const FIRST_ROUND_DATE = "2026-10-05";

/** Número de la ronda: la del 5 oct 2026 es la #1. */
export function roundNumber(date: string): number {
  const days = Math.round((Date.parse(date) - Date.parse(FIRST_ROUND_DATE)) / DAY_MS);
  return Math.max(1, days + 1);
}

/** "14 oct 2026" a partir de YYYY-MM-DD, sin depender del timezone del navegador. */
export function formatRoundDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1)).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

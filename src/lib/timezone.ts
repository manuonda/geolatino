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

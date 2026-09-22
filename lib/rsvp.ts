
export const RSVP_DEADLINE = new Date("2026-11-01T23:59:59-03:00");

export const RSVP_DEADLINE_LABEL = "1º de novembro de 2026";

/** Considera aberto até 23:59:59 do dia do prazo. */
export function isRsvpOpen(now: Date = new Date()): boolean {
  return now.getTime() <= RSVP_DEADLINE.getTime();
}

/** Milissegundos restantes (nunca negativo). */
export function msUntilDeadline(now: Date = new Date()): number {
  return Math.max(0, RSVP_DEADLINE.getTime() - now.getTime());
}

/** Dias inteiros restantes, arredondando pra baixo. */
export function daysUntilDeadline(now: Date = new Date()): number {
  return Math.floor(msUntilDeadline(now) / 86_400_000);
}
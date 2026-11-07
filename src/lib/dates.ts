const ARGENTINA_TZ = "America/Argentina/Buenos_Aires";

/** Día actual en hora de Argentina, como "YYYY-MM-DD" (RF-08h, RF-19f). */
export function todayInArgentina(now: Date = new Date()): string {
  // en-CA formatea como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: ARGENTINA_TZ }).format(now);
}

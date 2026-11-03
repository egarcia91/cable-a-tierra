import { z } from "zod";
import { todayInArgentina } from "@/lib/dates";
import { requiredText } from "./text";

export const PLAYER_NAME_MAX = 40;
export const PLAYER_NICKNAME_MAX = 40;
export const MAX_PLAYERS_PER_ORGANIZATION = 40;
export const MIN_BIRTH_DATE = "1920-01-01";

// También se usa para los jugadores/as externos/as de un partido (RF-19b, RF-19e).
export const nicknameSchema = requiredText(PLAYER_NICKNAME_MAX, {
  empty: "El jugador/a tiene que tener un apodo.",
  tooLong: `El apodo puede tener hasta ${PLAYER_NICKNAME_MAX} caracteres.`,
});

/** true si es una fecha real en formato YYYY-MM-DD (rechaza, por ejemplo, 2026-02-30). */
function isRealDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// Las fechas YYYY-MM-DD se comparan bien como texto.
const birthDateSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || null)
  .refine((value) => value === null || isRealDate(value), "La fecha de nacimiento no es válida.")
  .refine((value) => value === null || value >= MIN_BIRTH_DATE, "La fecha de nacimiento no puede ser anterior al 1/1/1920.")
  .refine((value) => value === null || value <= todayInArgentina(), "La fecha de nacimiento no puede ser posterior a hoy.");

// RF-05, RF-19a, RF-19c, RF-19d, RF-19f, RF-19l.
export const playerInputSchema = z.object({
  name: requiredText(PLAYER_NAME_MAX, {
    empty: "El jugador/a tiene que tener un nombre.",
    tooLong: `El nombre puede tener hasta ${PLAYER_NAME_MAX} caracteres.`,
  }),
  nickname: nicknameSchema,
  birthDate: birthDateSchema,
});

export type PlayerInput = z.input<typeof playerInputSchema>;
export type ValidPlayer = z.output<typeof playerInputSchema>;

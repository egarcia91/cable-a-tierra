import { z } from "zod";

/** Cantidad de caracteres reales (un emoji cuenta como uno, no como dos). */
export function charLength(value: string): number {
  return [...value].length;
}

/**
 * Texto obligatorio: se recortan los espacios, así que un texto de solo
 * espacios cuenta como vacío (RF-19l).
 */
export function requiredText(max: number, messages: { empty: string; tooLong: string }) {
  return z
    .string(messages.empty)
    .trim()
    .min(1, messages.empty)
    .refine((value) => charLength(value) <= max, messages.tooLong);
}

/** Texto opcional: vacío o solo espacios se guarda como null. */
export function optionalText(max: number, tooLong: string) {
  return z
    .string()
    .trim()
    .refine((value) => charLength(value) <= max, tooLong)
    .optional()
    .transform((value) => value || null);
}

/** Devuelve el primer mensaje de error, o null si el valor es válido. */
export function firstError(result: z.ZodSafeParseResult<unknown>): string | null {
  return result.success ? null : result.error.issues[0].message;
}

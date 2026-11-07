import "server-only";
import type { z } from "zod";
import { UserError } from "./errors";

/** Valida la entrada del cliente; si no es válida, tira un UserError con el primer motivo. */
export function validate<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) throw new UserError(result.error.issues[0].message);
  return result.data;
}

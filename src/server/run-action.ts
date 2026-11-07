import "server-only";
import type { ActionResult } from "@/lib/action-result";
import { UserError } from "./errors";

/** Ejecuta un server action: los UserError se devuelven como error; el resto se loguea. */
export async function runAction<T>(name: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof UserError) return { ok: false, error: error.message };
    console.error(name, error);
    return { ok: false, error: "Algo salió mal. Probá de nuevo." };
  }
}

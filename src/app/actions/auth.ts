"use server";

import { AuthError, requireUser } from "@/server/auth";
import { ensureUserRegistered } from "@/server/users";

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function registerUser(idToken: string): Promise<ActionResult> {
  try {
    const user = await requireUser(idToken);
    await ensureUserRegistered(user);
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) return { ok: false, error: error.message };
    console.error("registerUser", error);
    return { ok: false, error: "No pudimos registrarte. Probá de nuevo." };
  }
}

"use server";

import { cookies } from "next/headers";
import { DomainError } from "@/lib/domain/errors";
import { SESSION_COOKIE, SESSION_MAX_AGE_MS, startSession } from "@/lib/auth/session";

export async function login(idToken: string): Promise<{ error?: string }> {
  try {
    const sessionCookie = await startSession(idToken);
    (await cookies()).set(SESSION_COOKIE, sessionCookie, {
      maxAge: SESSION_MAX_AGE_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return {};
  } catch (err) {
    return { error: err instanceof DomainError ? err.message : "No se pudo iniciar sesión." };
  }
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

import "server-only";
import { cookies } from "next/headers";
import { DomainError } from "@/lib/domain/errors";
import { SESSION_COOKIE, userFromSessionCookie, type SessionUser } from "./session";

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return userFromSessionCookie(store.get(SESSION_COOKIE)?.value);
}

// Para Server Actions que modifican datos: sin sesión no se escribe nada (RF-04b).
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new DomainError("Tenés que iniciar sesión.");
  return user;
}

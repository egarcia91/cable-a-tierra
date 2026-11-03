import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase/admin";
import { UserError } from "./errors";

export class AuthError extends UserError {}

/**
 * Verifica el ID token del cliente y devuelve el usuario.
 * Solo se aceptan sesiones iniciadas con Google (RF-18), aunque el proyecto
 * tuviera habilitado otro método.
 */
export async function requireUser(idToken: string | undefined): Promise<DecodedIdToken> {
  if (!idToken) throw new AuthError("Tenés que iniciar sesión.");
  let decoded: DecodedIdToken;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch {
    throw new AuthError("La sesión no es válida. Volvé a iniciar sesión.");
  }
  if (decoded.firebase.sign_in_provider !== "google.com") {
    throw new AuthError("Solo se puede iniciar sesión con Google.");
  }
  if (!decoded.email) throw new AuthError("La cuenta de Google no tiene email.");
  return decoded;
}

import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { DomainError } from "@/lib/domain/errors";

export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000; // 5 días

// Solo se aceptan tokens de un login recién hecho, para que un token robado viejo no sirva.
const MAX_LOGIN_AGE_S = 5 * 60;

export interface SessionUser {
  uid: string;
  name: string;
  email: string | null;
}

// Verifica el ID token de un login con Google, registra al usuario si es su primer
// ingreso (RF-01) y devuelve la cookie de sesión.
export async function startSession(idToken: string): Promise<string> {
  const decoded = await adminAuth.verifyIdToken(idToken);

  // RF-18: aunque otro proveedor quede habilitado por error en Firebase, no se acepta.
  if (decoded.firebase.sign_in_provider !== "google.com") {
    throw new DomainError("Solo se puede ingresar con Google.");
  }
  if (Date.now() / 1000 - decoded.auth_time > MAX_LOGIN_AGE_S) {
    throw new DomainError("El inicio de sesión expiró. Volvé a ingresar.");
  }

  await registerUser({
    uid: decoded.uid,
    name: decoded.name ?? decoded.email ?? "Sin nombre",
    email: decoded.email ?? null,
  });

  return adminAuth.createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
}

async function registerUser(user: SessionUser): Promise<void> {
  try {
    await adminDb.doc(`users/${user.uid}`).create({
      name: user.name,
      email: user.email,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    // 6 = ALREADY_EXISTS: ya estaba registrado.
    if ((err as { code?: number }).code !== 6) throw err;
  }
}

export async function userFromSessionCookie(cookie: string | undefined): Promise<SessionUser | null> {
  if (!cookie) return null;
  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    return { uid: decoded.uid, name: decoded.name ?? decoded.email ?? "Sin nombre", email: decoded.email ?? null };
  } catch {
    return null;
  }
}

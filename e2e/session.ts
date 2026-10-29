import type { BrowserContext } from "@playwright/test";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { signInWithGoogle } from "../src/test/emulator";

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.METADATA_SERVER_DETECTION ??= "none";

const auth = getAuth(getApps()[0] ?? initializeApp({ projectId: "demo-cable-a-tierra" }));

// Inicia sesión sin pasar por el popup del emulador: ese popup baja un script de
// apis.google.com y, cuando esa descarga falla, el login queda colgado y el test falla al azar.
// El login real (verificación del token de Google, registro, rechazo de contraseñas) lo
// cubren los tests de integración de src/lib/auth.
export async function loginAs(context: BrowserContext, baseURL: string, user: { name: string; email: string }) {
  const { idToken } = await signInWithGoogle({ sub: `google-${user.email}`, ...user });
  const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn: 60 * 60 * 1000 });
  await context.addCookies([{ name: "__session", value: sessionCookie, url: baseURL, httpOnly: true }]);
}

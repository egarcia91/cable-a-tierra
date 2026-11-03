import "server-only";
import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

// El Admin SDK se conecta a los emuladores leyendo estas variables.
if (useEmulators) {
  process.env.FIRESTORE_EMULATOR_HOST ??= "localhost:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "localhost:9099";
}

function init() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (useEmulators) return initializeApp({ projectId });
  return initializeApp({
    credential: cert({
      projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Vercel guarda los saltos de línea de la clave como "\n" literales.
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const app = getApps().length ? getApp() : init();

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

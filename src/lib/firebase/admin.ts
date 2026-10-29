import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

// El Admin SDK detecta los emuladores por estas variables de entorno.
if (useEmulators) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
  process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
  // Sin esto, el SDK busca el servidor de metadatos de GCP y espera hasta el timeout.
  process.env.METADATA_SERVER_DETECTION ??= "none";
}

const app =
  getApps()[0] ??
  initializeApp(
    useEmulators
      ? { projectId: process.env.FIREBASE_PROJECT_ID }
      : {
          credential: cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
          }),
        },
  );

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

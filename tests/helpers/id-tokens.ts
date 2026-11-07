import { deleteApp, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithCredential,
} from "firebase/auth";
import { AUTH_EMULATOR_URL, TEST_PROJECT_ID } from "./emulators";

type GoogleAccount = { sub: string; email: string; name?: string };

async function withTestAuth<T>(fn: (auth: ReturnType<typeof getAuth>) => Promise<T>): Promise<T> {
  const app = initializeApp({ apiKey: "demo-api-key", projectId: TEST_PROJECT_ID }, `test-${crypto.randomUUID()}`);
  const auth = getAuth(app);
  connectAuthEmulator(auth, AUTH_EMULATOR_URL, { disableWarnings: true });
  try {
    return await fn(auth);
  } finally {
    await deleteApp(app);
  }
}

/** ID token de una sesión iniciada con Google en el emulador (acepta credenciales falsas). */
export function googleIdToken(account: GoogleAccount): Promise<string> {
  return withTestAuth(async (auth) => {
    const credential = GoogleAuthProvider.credential(JSON.stringify({ ...account, email_verified: true }));
    const { user } = await signInWithCredential(auth, credential);
    return user.getIdToken();
  });
}

/** ID token de una sesión con email y contraseña, para comprobar que se rechaza (RF-18). */
export function passwordIdToken(email: string): Promise<string> {
  return withTestAuth(async (auth) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, "contraseña-de-prueba");
    return user.getIdToken();
  });
}

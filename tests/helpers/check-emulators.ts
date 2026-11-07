import { AUTH_EMULATOR_URL, FIRESTORE_EMULATOR } from "./emulators";

export default async function checkEmulators() {
  for (const url of [`http://${FIRESTORE_EMULATOR.host}:${FIRESTORE_EMULATOR.port}`, AUTH_EMULATOR_URL]) {
    try {
      await fetch(url);
    } catch {
      throw new Error(`No hay emulador en ${url}. Levantalos con: npm run emulators`);
    }
  }
}

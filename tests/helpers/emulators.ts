// El emulador de Auth firma todos los tokens con el proyecto de la CLI, así que los
// tests usan el mismo proyecto que la app en local (y borran sus datos).
export const TEST_PROJECT_ID = "demo-cable-a-tierra";
export const FIRESTORE_EMULATOR = { host: "localhost", port: 8080 };
export const AUTH_EMULATOR_URL = "http://localhost:9099";

export async function clearFirestore(): Promise<void> {
  await fetch(
    `http://${FIRESTORE_EMULATOR.host}:${FIRESTORE_EMULATOR.port}/emulator/v1/projects/${TEST_PROJECT_ID}/databases/(default)/documents`,
    { method: "DELETE" },
  );
}

export async function clearAuth(): Promise<void> {
  await fetch(`${AUTH_EMULATOR_URL}/emulator/v1/projects/${TEST_PROJECT_ID}/accounts`, { method: "DELETE" });
}

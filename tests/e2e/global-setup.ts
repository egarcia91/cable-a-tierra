import checkEmulators from "../helpers/check-emulators";
import { clearAuth, clearFirestore } from "../helpers/emulators";

// Cada corrida de E2E arranca con los emuladores vacíos.
export default async function globalSetup() {
  await checkEmulators();
  await Promise.all([clearFirestore(), clearAuth()]);
}

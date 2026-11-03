import { readFileSync } from "node:fs";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { FIRESTORE_EMULATOR, TEST_PROJECT_ID } from "../helpers/emulators";

export async function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: TEST_PROJECT_ID,
    firestore: { ...FIRESTORE_EMULATOR, rules: readFileSync("firestore.rules", "utf8") },
  });
}

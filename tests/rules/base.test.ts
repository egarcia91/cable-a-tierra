import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails } from "@firebase/rules-unit-testing";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { createTestEnv } from "./setup";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createTestEnv();
});
beforeEach(async () => {
  await env.clearFirestore();
});
afterAll(async () => {
  await env.cleanup();
});

describe("reglas base", () => {
  it("rechaza escrituras de un invitado", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "cualquiera/doc"), { a: 1 }));
  });

  it("rechaza escrituras de un usuario registrado", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "cualquiera/doc"), { a: 1 }));
  });

  it("rechaza lecturas de colecciones no habilitadas", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, "cualquiera/doc")));
  });
});

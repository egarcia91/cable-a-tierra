import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { createTestEnv } from "./setup";

let env: RulesTestEnvironment;

const organization = {
  name: "Los Martes",
  nameSort: "los martes",
  description: "Fútbol los martes en Palermo",
  adminUid: "admin",
  memberUids: ["admin"],
  playerCount: 0,
  finishedMatchCount: 0,
};

beforeAll(async () => {
  env = await createTestEnv();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "organizations/org1"), organization);
  });
});
afterAll(async () => {
  await env.cleanup();
});

describe("organizations: lectura", () => {
  it("un invitado puede ver una organización", async () => {
    await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), "organizations/org1")));
  });

  it("un usuario registrado no miembro puede ver una organización", async () => {
    await assertSucceeds(getDoc(doc(env.authenticatedContext("otro").firestore(), "organizations/org1")));
  });
});

describe("organizations: escritura desde el cliente", () => {
  it("un invitado no puede crear una organización (AC-49)", async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(db, "organizations/nueva"), organization));
  });

  it("un usuario no puede crear una organización con otra cuenta como admin (AC-59)", async () => {
    const db = env.authenticatedContext("alice").firestore();
    await assertFails(setDoc(doc(db, "organizations/nueva"), { ...organization, adminUid: "bob", memberUids: ["bob"] }));
  });

  it("no se puede crear una organización sin administrador/a (AC-26)", async () => {
    const db = env.authenticatedContext("alice").firestore();
    const { adminUid: _, ...withoutAdmin } = organization;
    await assertFails(setDoc(doc(db, "organizations/nueva"), withoutAdmin));
  });

  it("un no admin no puede editar el nombre (AC-35a)", async () => {
    const db = env.authenticatedContext("otro").firestore();
    await assertFails(updateDoc(doc(db, "organizations/org1"), { name: "Hackeada" }));
  });

  it("un no admin no puede editar la descripción (AC-35b)", async () => {
    const db = env.authenticatedContext("otro").firestore();
    await assertFails(updateDoc(doc(db, "organizations/org1"), { description: "Hackeada" }));
  });

  it("ni siquiera el admin puede escribir directo: los contadores son del servidor", async () => {
    const db = env.authenticatedContext("admin").firestore();
    await assertFails(updateDoc(doc(db, "organizations/org1"), { finishedMatchCount: 100 }));
  });

  it("el admin no puede eliminar su organización (AC-20b)", async () => {
    const db = env.authenticatedContext("admin").firestore();
    await assertFails(deleteDoc(doc(db, "organizations/org1")));
  });
});

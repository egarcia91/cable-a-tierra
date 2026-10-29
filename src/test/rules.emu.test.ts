import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

const ORG = "organizations/org1";
const PLAYER = `${ORG}/players/p1`;
const PRIVATE = `${PLAYER}/private/data`;
const MATCH = `${ORG}/matches/m1`;
const FINISHED_MATCH = `${ORG}/matches/m2`;

let env: RulesTestEnvironment;

const guest = () => env.unauthenticatedContext().firestore();
const admin = () => env.authenticatedContext("admin-uid").firestore();
const outsider = () => env.authenticatedContext("otro-uid").firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-cable-a-tierra",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 },
  });
});

afterAll(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, ORG), { name: "Los Pibes", description: "Martes", adminUid: "admin-uid" });
    await setDoc(doc(db, PLAYER), { nickname: "Juancho", matches: 0, goals: 0 });
    await setDoc(doc(db, PRIVATE), { fullName: "Juan Pérez", birthDate: "1990-05-10" });
    await setDoc(doc(db, MATCH), { status: "pending", place: "Club" });
    await setDoc(doc(db, FINISHED_MATCH), { status: "finished", place: "Club" });
    await setDoc(doc(db, "users/admin-uid"), { email: "admin@example.com" });
  });
});

describe("lecturas", () => {
  it("cualquiera, incluso invitado, lee organizaciones, apodos y partidos", async () => {
    for (const db of [guest(), outsider(), admin()]) {
      await assertSucceeds(getDoc(doc(db, ORG)));
      await assertSucceeds(getDocs(collection(db, `${ORG}/players`)));
      await assertSucceeds(getDocs(collection(db, `${ORG}/matches`)));
    }
  });

  it("un invitado no lee nombre completo ni fecha de nacimiento (AC-06)", async () => {
    await assertFails(getDoc(doc(guest(), PRIVATE)));
  });

  it("un registrado que no es miembro no lee nombre completo ni fecha de nacimiento (AC-24)", async () => {
    await assertFails(getDoc(doc(outsider(), PRIVATE)));
  });

  it("el admin sí lee nombre completo y fecha de nacimiento (AC-08)", async () => {
    await assertSucceeds(getDoc(doc(admin(), PRIVATE)));
  });

  it("nadie lee los usuarios desde el cliente", async () => {
    await assertFails(getDoc(doc(admin(), "users/admin-uid")));
  });
});

describe("escrituras directas a la base", () => {
  it("un invitado no crea organizaciones (AC-49)", async () => {
    await assertFails(setDoc(doc(guest(), "organizations/nueva"), { name: "X", adminUid: "x" }));
  });

  it("no se crea una organización sin admin (AC-26)", async () => {
    await assertFails(setDoc(doc(outsider(), "organizations/nueva"), { name: "X", description: "" }));
  });

  it("un no admin no edita la organización (AC-35)", async () => {
    await assertFails(updateDoc(doc(outsider(), ORG), { name: "Hackeada" }));
  });

  it("nadie elimina una organización, ni su admin (AC-20)", async () => {
    await assertFails(deleteDoc(doc(admin(), ORG)));
  });

  it("un no admin no crea ni edita jugadores/as (AC-05a)", async () => {
    await assertFails(setDoc(doc(outsider(), `${ORG}/players/p2`), { nickname: "Intruso" }));
    await assertFails(updateDoc(doc(outsider(), PLAYER), { goals: 100 }));
    await assertFails(setDoc(doc(outsider(), PRIVATE), { fullName: "Otro" }));
  });

  it("un no admin no crea ni edita partidos (AC-05b)", async () => {
    await assertFails(setDoc(doc(outsider(), `${ORG}/matches/m3`), { status: "pending" }));
    await assertFails(updateDoc(doc(outsider(), MATCH), { place: "Otro" }));
  });

  it("un partido finalizado no se edita, ni por el admin (AC-51)", async () => {
    await assertFails(updateDoc(doc(admin(), FINISHED_MATCH), { place: "Otro" }));
  });
});

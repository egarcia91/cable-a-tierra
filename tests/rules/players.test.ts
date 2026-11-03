import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { createTestEnv } from "./setup";

let env: RulesTestEnvironment;

const PLAYER = "organizations/org1/players/p1";
const PRIVATE = `${PLAYER}/private/data`;

beforeAll(async () => {
  env = await createTestEnv();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    // "asociado" es una cuenta asociada a un jugador/a: está en memberUids sin ser admin.
    await setDoc(doc(db, "organizations/org1"), {
      name: "Los Martes",
      adminUid: "admin",
      memberUids: ["admin", "asociado"],
      playerCount: 1,
      finishedMatchCount: 0,
    });
    await setDoc(doc(db, PLAYER), { nickname: "Juancho", matches: 0, goals: 6, wins: 0, draws: 0, losses: 0 });
    await setDoc(doc(db, PRIVATE), { name: "Juan Pérez", birthDate: "1990-05-10" });
  });
});
afterAll(async () => {
  await env.cleanup();
});

const guest = () => env.unauthenticatedContext().firestore();
const as = (uid: string) => env.authenticatedContext(uid).firestore();

describe("players: lectura", () => {
  it("un invitado ve el apodo y las estadísticas (AC-06, AC-17b)", async () => {
    await assertSucceeds(getDoc(doc(guest(), PLAYER)));
  });

  it("un invitado no ve nombre ni fecha de nacimiento (AC-06)", async () => {
    await assertFails(getDoc(doc(guest(), PRIVATE)));
  });

  it("un registrado no miembro no ve nombre ni fecha de nacimiento (AC-24)", async () => {
    await assertSucceeds(getDoc(doc(as("otro"), PLAYER)));
    await assertFails(getDoc(doc(as("otro"), PRIVATE)));
  });

  it("el admin ve nombre y fecha de nacimiento (AC-08a)", async () => {
    await assertSucceeds(getDoc(doc(as("admin"), PRIVATE)));
  });

  it("una cuenta asociada a un jugador/a ve nombre y fecha de nacimiento (AC-08b)", async () => {
    await assertSucceeds(getDoc(doc(as("asociado"), PRIVATE)));
  });
});

describe("players: escritura desde el cliente", () => {
  it("un no admin no puede crear un jugador/a (AC-05a)", async () => {
    await assertFails(setDoc(doc(as("otro"), "organizations/org1/players/p2"), { nickname: "Tano" }));
  });

  it("un no admin no puede editar un jugador/a (AC-05b)", async () => {
    await assertFails(updateDoc(doc(as("otro"), PLAYER), { nickname: "Hackeado" }));
    await assertFails(updateDoc(doc(as("otro"), PRIVATE), { name: "Hackeado" }));
  });

  it("un invitado no puede editar un jugador/a (AC-57)", async () => {
    await assertFails(updateDoc(doc(guest(), PLAYER), { nickname: "Hackeado" }));
  });

  it("ni el admin puede cambiar las estadísticas directo (AC-60)", async () => {
    await assertFails(updateDoc(doc(as("admin"), PLAYER), { goals: 100 }));
  });
});

describe("accountLinks", () => {
  it("nadie lo lee ni escribe desde el cliente, ni el admin", async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "organizations/org1/accountLinks/asociado"), { playerId: "p1" });
    });

    await assertFails(getDoc(doc(as("admin"), "organizations/org1/accountLinks/asociado")));
    await assertFails(getDoc(doc(guest(), "organizations/org1/accountLinks/asociado")));
    await assertFails(setDoc(doc(as("admin"), "organizations/org1/accountLinks/otro"), { playerId: "p1" }));
  });
});

import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import { assertFails, assertSucceeds, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { createTestEnv } from "./setup";

let env: RulesTestEnvironment;

const MATCH = "organizations/org1/matches/m1";
const match = {
  date: "2026-03-17",
  place: "Cancha 1",
  status: "pending",
  teamA: [{ type: "player", playerId: "p1" }],
  teamB: [{ type: "external", nickname: "Tano" }],
};

beforeAll(async () => {
  env = await createTestEnv();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "organizations/org1"), { name: "Los Martes", adminUid: "admin", memberUids: ["admin"] });
    await setDoc(doc(ctx.firestore(), MATCH), match);
    await setDoc(doc(ctx.firestore(), "organizations/org1/matches/m2"), { ...match, status: "finished" });
  });
});
afterAll(async () => {
  await env.cleanup();
});

const guest = () => env.unauthenticatedContext().firestore();
const as = (uid: string) => env.authenticatedContext(uid).firestore();

describe("matches", () => {
  it("un invitado ve los partidos (AC-16b)", async () => {
    await assertSucceeds(getDoc(doc(guest(), MATCH)));
  });

  it("un no admin no puede crear un partido (AC-05c)", async () => {
    await assertFails(setDoc(doc(as("otro"), "organizations/org1/matches/m3"), match));
  });

  it("un invitado no puede crear un partido (AC-58)", async () => {
    await assertFails(setDoc(doc(guest(), "organizations/org1/matches/m3"), match));
  });

  it("un no admin no puede editar un partido pendiente (AC-05d)", async () => {
    await assertFails(updateDoc(doc(as("otro"), MATCH), { place: "Hackeada" }));
  });

  it("un no admin no puede corregir un partido finalizado (AC-05e)", async () => {
    await assertFails(updateDoc(doc(as("otro"), "organizations/org1/matches/m2"), { place: "Hackeada" }));
  });

  it("ni el admin escribe directo: todo pasa por el servidor", async () => {
    await assertFails(updateDoc(doc(as("admin"), MATCH), { status: "finished" }));
  });
});

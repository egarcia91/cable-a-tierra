import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, Timestamp, type Firestore } from "firebase/firestore";
import { fetchMatchesPage } from "@/lib/queries/matches";
import { createTestEnv } from "./setup";

let env: RulesTestEnvironment;

type Seed = { id: string; date: string; status?: "pending" | "finished"; createdAt?: number };

async function seed(matches: Seed[]) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await Promise.all(
      matches.map((m, i) =>
        setDoc(doc(db, `organizations/org1/matches/${m.id}`), {
          date: m.date,
          place: "Cancha 1",
          status: m.status ?? "pending",
          teamA: [{ type: "external", nickname: "Tano" }],
          teamB: [{ type: "external", nickname: "Lucho" }],
          createdAt: Timestamp.fromMillis(m.createdAt ?? i),
        }),
      ),
    );
  });
}

// Las consultas se hacen como invitado: también prueba que las rules permiten listar.
const guestDb = () => env.unauthenticatedContext().firestore() as unknown as Firestore;
const ids = (page: { items: { id: string }[] }) => page.items.map((m) => m.id);

beforeAll(async () => {
  env = await createTestEnv();
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "organizations/org1"), { name: "Los Martes", adminUid: "admin", memberUids: ["admin"] });
  });
});
afterAll(async () => {
  await env.cleanup();
});

describe("listado de partidos", () => {
  it("un invitado ve los 3 partidos (AC-16b)", async () => {
    await seed([
      { id: "m1", date: "2026-03-03" },
      { id: "m2", date: "2026-03-10" },
      { id: "m3", date: "2026-03-17" },
    ]);

    expect(ids(await fetchMatchesPage(guestDb(), "org1"))).toEqual(["m3", "m2", "m1"]);
  });

  it("del más reciente al más antiguo, con su estado (AC-16a)", async () => {
    await seed([
      { id: "marzo-10", date: "2026-03-10", status: "finished" },
      { id: "marzo-17", date: "2026-03-17", status: "pending" },
    ]);

    const page = await fetchMatchesPage(guestDb(), "org1");

    expect(page.items.map((m) => [m.id, m.status])).toEqual([
      ["marzo-17", "pending"],
      ["marzo-10", "finished"],
    ]);
  });

  it("el mismo día, el dado de alta después va primero (AC-93)", async () => {
    await seed([
      { id: "P1", date: "2026-03-17", createdAt: 1_000 },
      { id: "P2", date: "2026-03-17", createdAt: 2_000 },
    ]);

    expect(ids(await fetchMatchesPage(guestDb(), "org1"))).toEqual(["P2", "P1"]);
  });

  it("de a 10, con la opción de ver los siguientes (AC-85)", async () => {
    // 25 partidos, uno por día de enero.
    await seed(Array.from({ length: 25 }, (_, i) => ({ id: `m${i + 1}`, date: `2026-01-${String(i + 1).padStart(2, "0")}` })));

    const first = await fetchMatchesPage(guestDb(), "org1");
    expect(ids(first)).toEqual(Array.from({ length: 10 }, (_, i) => `m${25 - i}`));

    const second = await fetchMatchesPage(guestDb(), "org1", first.next);
    expect(ids(second)).toEqual(Array.from({ length: 10 }, (_, i) => `m${15 - i}`));

    const third = await fetchMatchesPage(guestDb(), "org1", second.next);
    expect(third.items).toHaveLength(5);
    expect(third.next).toBeNull();
  });

  it("solo trae los partidos de esa organización", async () => {
    await seed([{ id: "m1", date: "2026-03-17" }]);
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), "organizations/org2/matches/otro"), { date: "2026-03-18", createdAt: Timestamp.now() });
    });

    expect(ids(await fetchMatchesPage(guestDb(), "org1"))).toEqual(["m1"]);
  });
});

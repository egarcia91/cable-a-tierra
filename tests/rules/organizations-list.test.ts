import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc, type Firestore } from "firebase/firestore";
import { fetchOrganizationsPage } from "@/lib/queries/organizations";
import { sortKey } from "@/lib/sort-key";
import { createTestEnv } from "./setup";

let env: RulesTestEnvironment;

async function seed(organizations: { name: string; finishedMatchCount: number }[]) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore() as unknown as Firestore;
    await Promise.all(
      organizations.map((o, i) =>
        setDoc(doc(db, `organizations/org${i}`), {
          name: o.name,
          nameSort: sortKey(o.name),
          description: null,
          adminUid: "admin",
          memberUids: ["admin"],
          playerCount: 0,
          finishedMatchCount: o.finishedMatchCount,
        }),
      ),
    );
  });
}

// Las consultas se hacen como invitado: también prueba que las rules permiten listar.
const guestDb = () => env.unauthenticatedContext().firestore() as unknown as Firestore;
const names = (page: { items: { name: string }[] }) => page.items.map((o) => o.name);

beforeAll(async () => {
  env = await createTestEnv();
});
beforeEach(async () => {
  await env.clearFirestore();
});
afterAll(async () => {
  await env.cleanup();
});

describe("listado de organizaciones", () => {
  it("un invitado ve todas las organizaciones (AC-19)", async () => {
    await seed([
      { name: "Alfa", finishedMatchCount: 0 },
      { name: "Beta", finishedMatchCount: 0 },
      { name: "Gamma", finishedMatchCount: 0 },
    ]);

    const page = await fetchOrganizationsPage(guestDb());

    expect(names(page)).toHaveLength(3);
    expect(page.next).toBeNull();
  });

  it("ordena por partidos finalizados y desempata por nombre (AC-33)", async () => {
    await seed([
      { name: "Gamma", finishedMatchCount: 3 },
      { name: "Alfa", finishedMatchCount: 3 },
      { name: "Beta", finishedMatchCount: 8 },
    ]);

    expect(names(await fetchOrganizationsPage(guestDb()))).toEqual(["Beta", "Alfa", "Gamma"]);
  });

  it("desempata sin distinguir mayúsculas ni tildes", async () => {
    await seed([
      { name: "zorros", finishedMatchCount: 1 },
      { name: "Árboles", finishedMatchCount: 1 },
      { name: "Burros", finishedMatchCount: 1 },
    ]);

    expect(names(await fetchOrganizationsPage(guestDb()))).toEqual(["Árboles", "Burros", "zorros"]);
  });

  it("muestra de a 10 y al pedir la página siguiente se ven 20 (AC-86)", async () => {
    // 25 organizaciones con distinta cantidad de partidos: Org 25 es la primera.
    await seed(
      Array.from({ length: 25 }, (_, i) => ({ name: `Org ${String(i + 1).padStart(2, "0")}`, finishedMatchCount: i + 1 })),
    );

    const first = await fetchOrganizationsPage(guestDb());
    expect(names(first)).toHaveLength(10);
    expect(names(first)[0]).toBe("Org 25");
    expect(first.next).not.toBeNull();

    const second = await fetchOrganizationsPage(guestDb(), first.next);
    const seen = [...names(first), ...names(second)];
    expect(seen).toHaveLength(20);
    expect(new Set(seen).size).toBe(20);
    expect(seen[19]).toBe("Org 06");

    const third = await fetchOrganizationsPage(guestDb(), second.next);
    expect(names(third)).toHaveLength(5);
    expect(third.next).toBeNull();
  });

  it("con exactamente 10 organizaciones no ofrece página siguiente", async () => {
    await seed(Array.from({ length: 10 }, (_, i) => ({ name: `Org ${i}`, finishedMatchCount: 0 })));

    const page = await fetchOrganizationsPage(guestDb());

    expect(names(page)).toHaveLength(10);
    expect(page.next).toBeNull();
  });
});

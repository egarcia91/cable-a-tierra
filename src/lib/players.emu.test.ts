import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { clearFirestore } from "@/test/emulator";
import { createOrganization } from "./organizations";
import { createPlayer, listPlayers } from "./players";

const ADMIN = "uid-admin";
const juan = { fullName: "Juan Pérez", nickname: "Juancho", birthDate: "1990-05-10" };

let orgId: string;

beforeEach(async () => {
  await clearFirestore();
  orgId = await createOrganization(ADMIN, { name: "Los Pibes", description: "" });
});

describe("createPlayer", () => {
  it("guarda nombre, apodo y fecha con estadísticas en 0 (AC-04) y aparece en el listado (AC-27)", async () => {
    const id = await createPlayer(ADMIN, orgId, juan);

    expect(await listPlayers(orgId, ADMIN)).toEqual([
      { id, ...juan, matches: 0, goals: 0, wins: 0, draws: 0, losses: 0 },
    ]);
    expect((await adminDb.doc(`organizations/${orgId}`).get()).get("playerCount")).toBe(1);
  });

  it("guarda nombre y fecha de nacimiento fuera del documento público", async () => {
    const id = await createPlayer(ADMIN, orgId, juan);
    const pub = await adminDb.doc(`organizations/${orgId}/players/${id}`).get();
    expect(pub.data()).not.toHaveProperty("fullName");
    expect(pub.data()).not.toHaveProperty("birthDate");
  });

  it("rechaza si quien crea no es el admin (AC-05a)", async () => {
    await expect(createPlayer("uid-otro", orgId, juan)).rejects.toThrow(/admin/);
    expect(await listPlayers(orgId, ADMIN)).toEqual([]);
  });

  it("rechaza si la organización no existe", async () => {
    await expect(createPlayer(ADMIN, "no-existe", juan)).rejects.toThrow(/no existe/);
  });

  it("valida los datos (AC-22b)", async () => {
    await expect(createPlayer(ADMIN, orgId, { ...juan, fullName: "x".repeat(41) })).rejects.toThrow(/40/);
  });

  it("con 39 acepta y queda en 40 (AC-36); con 40 rechaza (AC-37)", async () => {
    await adminDb.doc(`organizations/${orgId}`).update({ playerCount: 39 });

    await createPlayer(ADMIN, orgId, juan);
    expect((await adminDb.doc(`organizations/${orgId}`).get()).get("playerCount")).toBe(40);

    await expect(createPlayer(ADMIN, orgId, { ...juan, nickname: "Otro" })).rejects.toThrow(/40/);
  });

  it("dos altas simultáneas con 39 no pasan el tope", async () => {
    await adminDb.doc(`organizations/${orgId}`).update({ playerCount: 39 });

    const results = await Promise.allSettled([
      createPlayer(ADMIN, orgId, juan),
      createPlayer(ADMIN, orgId, { ...juan, nickname: "Otro" }),
    ]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await adminDb.doc(`organizations/${orgId}`).get()).get("playerCount")).toBe(40);
  });
});

describe("listPlayers", () => {
  it("a quien no es miembro, o es invitado, solo le da apodos y estadísticas (AC-06, AC-24)", async () => {
    await createPlayer(ADMIN, orgId, juan);

    for (const viewer of [null, "uid-otro"]) {
      const [player] = await listPlayers(orgId, viewer);
      expect(player.nickname).toBe("Juancho");
      expect(player).not.toHaveProperty("fullName");
      expect(player).not.toHaveProperty("birthDate");
    }
  });

  it("ordena por apodo", async () => {
    await createPlayer(ADMIN, orgId, { ...juan, nickname: "Zurdo" });
    await createPlayer(ADMIN, orgId, { ...juan, nickname: "Abuelo" });
    expect((await listPlayers(orgId, null)).map((p) => p.nickname)).toEqual(["Abuelo", "Zurdo"]);
  });
});

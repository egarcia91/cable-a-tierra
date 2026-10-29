import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { clearFirestore } from "@/test/emulator";
import { createMatch, listMatches } from "./matches";
import { createOrganization } from "./organizations";
import { createPlayer } from "./players";

const ADMIN = "uid-admin";
let orgId: string;
let juan: string;
let pepe: string;

const matchDoc = (id: string) => adminDb.doc(`organizations/${orgId}/matches/${id}`).get();

beforeEach(async () => {
  await clearFirestore();
  orgId = await createOrganization(ADMIN, { name: "Los Pibes", description: "" });
  juan = await createPlayer(ADMIN, orgId, { fullName: "Juan Pérez", nickname: "Juancho", birthDate: "1990-05-10" });
  pepe = await createPlayer(ADMIN, orgId, { fullName: "José Gómez", nickname: "Pepe", birthDate: "1988-01-20" });
});

const base = () => ({
  date: "2026-10-16",
  place: "Club Atlético",
  teamA: [{ playerId: juan, nickname: "" }],
  teamB: [{ playerId: pepe, nickname: "" }],
});

describe("createMatch", () => {
  it("queda creado sin finalizar con día, lugar y equipos (AC-14)", async () => {
    const id = await createMatch(ADMIN, orgId, base());

    expect((await matchDoc(id)).data()).toMatchObject({
      date: "2026-10-16",
      place: "Club Atlético",
      status: "pending",
      teamA: [{ playerId: juan, nickname: "Juancho" }],
      teamB: [{ playerId: pepe, nickname: "Pepe" }],
    });
  });

  it("el apodo de los jugadores/as sale de la base, no del formulario", async () => {
    const id = await createMatch(ADMIN, orgId, { ...base(), teamA: [{ playerId: juan, nickname: "Trucho" }] });
    expect((await matchDoc(id)).get("teamA")).toEqual([{ playerId: juan, nickname: "Juancho" }]);
  });

  it("acepta un externo/a con solo su apodo (AC-55)", async () => {
    const id = await createMatch(ADMIN, orgId, {
      ...base(),
      teamB: [{ playerId: pepe, nickname: "" }, { playerId: null, nickname: "Tano" }],
    });
    expect((await matchDoc(id)).get("teamB")).toContainEqual({ playerId: null, nickname: "Tano" });
  });

  it("acepta un equipo formado solo por externos/as", async () => {
    await expect(
      createMatch(ADMIN, orgId, { ...base(), teamB: [{ playerId: null, nickname: "Tano" }] }),
    ).resolves.toBeTypeOf("string");
  });

  it("rechaza un equipo sin jugadores/as (AC-54)", async () => {
    await expect(createMatch(ADMIN, orgId, { ...base(), teamB: [] })).rejects.toThrow(/al menos 1/);
  });

  it("rechaza si quien lo da de alta no es el admin (AC-05b)", async () => {
    await expect(createMatch("uid-otro", orgId, base())).rejects.toThrow(/admin/);
  });

  it("rechaza jugadores/as que no son de la organización", async () => {
    const otraOrg = await createOrganization(ADMIN, { name: "Otra", description: "" });
    const ajeno = await createPlayer(ADMIN, otraOrg, { fullName: "Ajeno", nickname: "Ajeno", birthDate: "1990-01-01" });

    await expect(
      createMatch(ADMIN, orgId, { ...base(), teamB: [{ playerId: ajeno, nickname: "" }] }),
    ).rejects.toThrow(/no pertenece/);
  });
});

describe("listMatches", () => {
  it("ordena del día más reciente al más antiguo; a igual día, el último cargado primero (RF-12)", async () => {
    const viejo = await createMatch(ADMIN, orgId, { ...base(), date: "2026-09-01" });
    const nuevo = await createMatch(ADMIN, orgId, { ...base(), date: "2026-10-10" });
    const mismoDia1 = await createMatch(ADMIN, orgId, { ...base(), date: "2026-10-01" });
    const mismoDia2 = await createMatch(ADMIN, orgId, { ...base(), date: "2026-10-01" });

    expect((await listMatches(orgId)).map((m) => m.id)).toEqual([nuevo, mismoDia2, mismoDia1, viejo]);
  });

  it("indica si cada partido está pendiente o finalizado (AC-16)", async () => {
    const pendiente = await createMatch(ADMIN, orgId, base());
    const finalizado = await createMatch(ADMIN, orgId, { ...base(), date: "2026-10-01" });
    // El paso 9 agrega la finalización; acá se simula directo en la base.
    await adminDb.doc(`organizations/${orgId}/matches/${finalizado}`).update({ status: "finished", scoreA: 2, scoreB: 1 });

    const matches = await listMatches(orgId);
    expect(matches.find((m) => m.id === pendiente)?.status).toBe("pending");
    expect(matches.find((m) => m.id === finalizado)).toMatchObject({ status: "finished", scoreA: 2, scoreB: 1 });
  });

  it("marca como externo/a a quien no pertenece a la organización (AC-23a)", async () => {
    await createMatch(ADMIN, orgId, {
      ...base(),
      teamB: [{ playerId: pepe, nickname: "" }, { playerId: null, nickname: "Tano" }],
    });

    const [match] = await listMatches(orgId);
    expect(match.teamA).toEqual([{ playerId: juan, nickname: "Juancho", external: false }]);
    expect(match.teamB).toContainEqual({ playerId: null, nickname: "Tano", external: true });
  });

  it("devuelve una lista vacía si no hay partidos", async () => {
    expect(await listMatches(orgId)).toEqual([]);
  });
});

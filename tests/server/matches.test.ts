import { beforeEach, describe, expect, it } from "vitest";
import { createMatchAction, updatePendingMatchAction } from "@/app/actions/matches";
import { createOrganizationAction } from "@/app/actions/organizations";
import { createPlayerAction } from "@/app/actions/players";
import { adminDb } from "@/lib/firebase/admin";
import type { MatchInput } from "@/lib/validation/match";
import { clearAuth, clearFirestore } from "../helpers/emulators";
import { googleIdToken } from "../helpers/id-tokens";

let adminToken: string;
let otherToken: string;
let organizationId: string;
let juancho: string;
let beto: string;

async function unwrap<T>(promise: Promise<{ ok: true; data: T } | { ok: false; error: string }>): Promise<T> {
  const result = await promise;
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

const player = (playerId: string) => ({ type: "player", playerId }) as const;
const external = (nickname: string) => ({ type: "external", nickname }) as const;
const matchDoc = async (id: string) => (await adminDb.doc(`organizations/${organizationId}/matches/${id}`).get()).data();
const matchCount = async () => (await adminDb.collection(`organizations/${organizationId}/matches`).get()).size;

function baseMatch(): MatchInput {
  return { date: "2026-03-17", place: "Cancha 1", teamA: [player(juancho)], teamB: [player(beto)] };
}

beforeEach(async () => {
  await Promise.all([clearFirestore(), clearAuth()]);
  adminToken = await googleIdToken({ sub: "google-admin", email: "admin@gmail.com" });
  otherToken = await googleIdToken({ sub: "google-otro", email: "otro@gmail.com" });
  organizationId = (await unwrap(createOrganizationAction(adminToken, { name: "Los Martes" }))).id;
  juancho = (await unwrap(createPlayerAction(adminToken, organizationId, { name: "Juan Pérez", nickname: "Juancho" }))).id;
  beto = (await unwrap(createPlayerAction(adminToken, organizationId, { name: "Alberto Díaz", nickname: "Beto" }))).id;
});

describe("dar de alta un partido", () => {
  it("queda creado como pendiente con día, lugar y equipos (AC-14)", async () => {
    const { id } = await unwrap(createMatchAction(adminToken, organizationId, baseMatch()));

    expect(await matchDoc(id)).toMatchObject({
      date: "2026-03-17",
      place: "Cancha 1",
      status: "pending",
      teamA: [player(juancho)],
      teamB: [player(beto)],
    });
  });

  it("no suma estadísticas mientras está pendiente", async () => {
    await unwrap(createMatchAction(adminToken, organizationId, baseMatch()));

    const snap = await adminDb.doc(`organizations/${organizationId}/players/${juancho}`).get();
    expect(snap.get("matches")).toBe(0);
  });

  it("acepta un externo/a con su apodo (AC-55)", async () => {
    const { id } = await unwrap(
      createMatchAction(adminToken, organizationId, { ...baseMatch(), teamA: [player(juancho), external("Tano")] }),
    );

    expect((await matchDoc(id))?.teamA).toEqual([player(juancho), external("Tano")]);
  });

  it("rechaza un equipo sin jugadores/as (AC-54)", async () => {
    const result = await createMatchAction(adminToken, organizationId, { ...baseMatch(), teamB: [] });

    expect(result).toEqual({ ok: false, error: "El equipo B tiene que tener al menos 1 jugador/a." });
    expect(await matchCount()).toBe(0);
  });

  it("rechaza al mismo jugador/a en los dos equipos (AC-62)", async () => {
    const result = await createMatchAction(adminToken, organizationId, { ...baseMatch(), teamB: [player(juancho)] });

    expect(result.ok).toBe(false);
    expect(await matchCount()).toBe(0);
  });

  it("rechaza un jugador/a que no es de la organización", async () => {
    const result = await createMatchAction(adminToken, organizationId, { ...baseMatch(), teamB: [player("de-otra-org")] });

    expect(result).toEqual({ ok: false, error: "Hay jugadores/as que no son de esta organización." });
    expect(await matchCount()).toBe(0);
  });

  it("rechaza un partido sin lugar (AC-81)", async () => {
    const result = await createMatchAction(adminToken, organizationId, { ...baseMatch(), place: "" });

    expect(result).toEqual({ ok: false, error: "El partido tiene que tener un lugar." });
  });

  it("un usuario que no es admin no puede dar de alta partidos (AC-05c)", async () => {
    const result = await createMatchAction(otherToken, organizationId, baseMatch());

    expect(result).toEqual({ ok: false, error: "Solo el administrador/a de la organización puede hacer esto." });
    expect(await matchCount()).toBe(0);
  });

  it("un invitado no puede dar de alta partidos (AC-58)", async () => {
    const result = await createMatchAction(undefined, organizationId, baseMatch());

    expect(result.ok).toBe(false);
    expect(await matchCount()).toBe(0);
  });
});

describe("editar un partido pendiente", () => {
  let matchId: string;

  beforeEach(async () => {
    matchId = (await unwrap(createMatchAction(adminToken, organizationId, baseMatch()))).id;
  });

  it("cambia el lugar (AC-50a)", async () => {
    await unwrap(updatePendingMatchAction(adminToken, organizationId, matchId, { ...baseMatch(), place: "Cancha 2" }));

    expect((await matchDoc(matchId))?.place).toBe("Cancha 2");
  });

  it("cambia el día (AC-50b)", async () => {
    await unwrap(updatePendingMatchAction(adminToken, organizationId, matchId, { ...baseMatch(), date: "2026-03-18" }));

    expect((await matchDoc(matchId))?.date).toBe("2026-03-18");
  });

  it("pasa a un jugador/a del equipo A al B (AC-50c)", async () => {
    await unwrap(
      updatePendingMatchAction(adminToken, organizationId, matchId, {
        ...baseMatch(),
        teamA: [external("Tano")],
        teamB: [player(beto), player(juancho)],
      }),
    );

    const match = await matchDoc(matchId);
    expect(match?.teamA).toEqual([external("Tano")]);
    expect(match?.teamB).toEqual([player(beto), player(juancho)]);
  });

  it("agrega un externo/a al equipo A (AC-91)", async () => {
    await unwrap(
      updatePendingMatchAction(adminToken, organizationId, matchId, {
        ...baseMatch(),
        teamA: [player(juancho), external("Tano")],
      }),
    );

    expect((await matchDoc(matchId))?.teamA).toEqual([player(juancho), external("Tano")]);
  });

  it("aplica las mismas validaciones que al darlo de alta", async () => {
    const result = await updatePendingMatchAction(adminToken, organizationId, matchId, { ...baseMatch(), teamA: [] });

    expect(result.ok).toBe(false);
    expect((await matchDoc(matchId))?.teamA).toEqual([player(juancho)]);
  });

  it("un usuario que no es admin no puede editarlo (AC-05d)", async () => {
    const result = await updatePendingMatchAction(otherToken, organizationId, matchId, { ...baseMatch(), place: "X" });

    expect(result.ok).toBe(false);
    expect((await matchDoc(matchId))?.place).toBe("Cancha 1");
  });

  it("no edita un partido finalizado: eso es la corrección", async () => {
    await adminDb.doc(`organizations/${organizationId}/matches/${matchId}`).update({ status: "finished" });

    const result = await updatePendingMatchAction(adminToken, organizationId, matchId, { ...baseMatch(), place: "X" });

    expect(result).toEqual({ ok: false, error: "El partido ya está finalizado." });
  });

  it("rechaza editar un partido que no existe", async () => {
    const result = await updatePendingMatchAction(adminToken, organizationId, "no-existe", baseMatch());

    expect(result).toEqual({ ok: false, error: "El partido no existe." });
  });
});

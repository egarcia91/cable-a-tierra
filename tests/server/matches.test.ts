import { beforeEach, describe, expect, it } from "vitest";
import {
  correctMatchAction,
  createMatchAction,
  finishMatchAction,
  updatePendingMatchAction,
} from "@/app/actions/matches";
import { createOrganizationAction } from "@/app/actions/organizations";
import { createPlayerAction } from "@/app/actions/players";
import { todayInArgentina } from "@/lib/dates";
import { adminDb } from "@/lib/firebase/admin";
import type { CorrectMatchInput, FinishMatchInput, MatchInput } from "@/lib/validation/match";
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

const scoredPlayer = (playerId: string, goals = 0, ownGoals = 0) => ({ ...player(playerId), goals, ownGoals });
const scoredExternal = (nickname: string, goals = 0, ownGoals = 0) => ({ ...external(nickname), goals, ownGoals });
const stats = async (playerId: string) => {
  const snap = await adminDb.doc(`organizations/${organizationId}/players/${playerId}`).get();
  const { matches, goals, wins, draws, losses } = snap.data()!;
  return { matches, goals, wins, draws, losses };
};
const setStats = (playerId: string, values: Record<string, number>) =>
  adminDb.doc(`organizations/${organizationId}/players/${playerId}`).update(values);

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

describe("finalizar un partido", () => {
  let matchId: string;
  let pepe: string;

  const finish = (input: FinishMatchInput, token = adminToken, id = matchId) =>
    finishMatchAction(token, organizationId, id, input);
  const reschedule = (date: string) => adminDb.doc(`organizations/${organizationId}/matches/${matchId}`).update({ date });
  const finishedCount = async () =>
    (await adminDb.doc(`organizations/${organizationId}`).get()).get("finishedMatchCount");

  beforeEach(async () => {
    pepe = (await unwrap(createPlayerAction(adminToken, organizationId, { name: "José Gómez", nickname: "Pepe" }))).id;
    matchId = (
      await unwrap(
        createMatchAction(adminToken, organizationId, {
          ...baseMatch(),
          teamA: [player(juancho), external("Tano")],
          teamB: [player(beto), player(pepe)],
        }),
      )
    ).id;
  });

  const lineup = (a: [number, number?][] = [], b: [number, number?][] = []): FinishMatchInput => ({
    teamA: [scoredPlayer(juancho, ...(a[0] ?? [0])), scoredExternal("Tano", ...(a[1] ?? [0]))],
    teamB: [scoredPlayer(beto, ...(b[0] ?? [0])), scoredPlayer(pepe, ...(b[1] ?? [0]))],
  });

  it("queda finalizado con el marcador 2 a 1 (AC-53)", async () => {
    await unwrap(finish(lineup([[2]], [[1]])));

    expect(await matchDoc(matchId)).toMatchObject({ status: "finished", scoreA: 2, scoreB: 1 });
    expect((await matchDoc(matchId))?.teamA).toEqual(lineup([[2]], [[1]]).teamA);
  });

  it("suma un partido y los goles (AC-01, AC-02)", async () => {
    await setStats(juancho, { matches: 7, goals: 4 });

    await unwrap(finish(lineup([[2]])));

    expect(await stats(juancho)).toMatchObject({ matches: 8, goals: 6 });
  });

  it("suma victoria al que gana y derrota al que pierde (AC-03a, AC-03c)", async () => {
    await unwrap(finish(lineup([[3], [2]], [[3]])));

    expect(await stats(juancho)).toEqual({ matches: 1, goals: 3, wins: 1, draws: 0, losses: 0 });
    expect(await stats(beto)).toEqual({ matches: 1, goals: 3, wins: 0, draws: 0, losses: 1 });
    expect(await stats(pepe)).toEqual({ matches: 1, goals: 0, wins: 0, draws: 0, losses: 1 });
  });

  it("suma un empate a todos si empatan (AC-03b)", async () => {
    await unwrap(finish(lineup([[3]], [[3]])));

    expect((await stats(juancho)).draws).toBe(1);
    expect((await stats(beto)).draws).toBe(1);
  });

  it("el gol en contra va al rival y no se acredita (AC-15)", async () => {
    await unwrap(finish(lineup([[2, 1]])));

    expect(await matchDoc(matchId)).toMatchObject({ scoreA: 2, scoreB: 1 });
    expect((await stats(juancho)).goals).toBe(2);
    expect((await stats(beto)).goals).toBe(0);
    expect((await stats(pepe)).goals).toBe(0);
  });

  it("los goles del externo/a cuentan para su equipo pero no suma estadísticas (AC-23b, AC-23c)", async () => {
    await unwrap(finish(lineup([[0], [2]])));

    expect(await matchDoc(matchId)).toMatchObject({ scoreA: 2, scoreB: 0 });
    // Sus goles no van a ningún jugador/a de la organización.
    expect((await stats(juancho)).goals).toBe(0);
    const players = await adminDb.collection(`organizations/${organizationId}/players`).get();
    expect(players.docs.map((d) => d.get("nickname")).sort()).toEqual(["Beto", "Juancho", "Pepe"]);
  });

  it("cuenta el partido finalizado en la organización", async () => {
    await unwrap(finish(lineup()));

    expect(await finishedCount()).toBe(1);
  });

  it("acepta 0 goles (AC-63)", async () => {
    expect(await finish(lineup())).toEqual({ ok: true, data: undefined });
  });

  it("rechaza goles negativos o no enteros sin tocar nada (AC-64, AC-65)", async () => {
    for (const goals of [-1, 1.5]) {
      const result = await finish(lineup([[goals]]));
      expect(result).toEqual({ ok: false, error: "Los goles tienen que ser números enteros mayores o iguales a 0." });
    }
    expect((await matchDoc(matchId))?.status).toBe("pending");
    expect((await stats(juancho)).matches).toBe(0);
  });

  it("acepta un partido de hoy en hora de Argentina (AC-66)", async () => {
    await reschedule(todayInArgentina());

    expect((await finish(lineup())).ok).toBe(true);
  });

  it("rechaza un partido de mañana en hora de Argentina (AC-67)", async () => {
    const tomorrow = new Date(`${todayInArgentina()}T12:00:00Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    await reschedule(tomorrow.toISOString().slice(0, 10));

    const result = await finish(lineup());

    expect(result).toEqual({ ok: false, error: "No se puede finalizar un partido de un día que todavía no llegó." });
    expect((await stats(juancho)).matches).toBe(0);
  });

  it("rechaza finalizarlo de nuevo y no vuelve a sumar (AC-61)", async () => {
    await setStats(juancho, { matches: 7 });
    await unwrap(finish(lineup()));

    const result = await finish(lineup([[3]]));

    expect(result).toEqual({ ok: false, error: "El partido ya está finalizado." });
    expect(await stats(juancho)).toMatchObject({ matches: 8, goals: 0 });
    expect(await finishedCount()).toBe(1);
  });

  it("rechaza goles para una alineación distinta a la guardada", async () => {
    const result = await finish({ ...lineup(), teamB: [scoredPlayer(beto, 5)] });

    expect(result).toEqual({ ok: false, error: "El partido cambió mientras cargabas los goles. Volvé a abrirlo." });
    expect((await stats(beto)).goals).toBe(0);
  });

  it("un usuario que no es admin no puede finalizarlo", async () => {
    const result = await finish(lineup([[2]]), otherToken);

    expect(result).toEqual({ ok: false, error: "Solo el administrador/a de la organización puede hacer esto." });
    expect((await matchDoc(matchId))?.status).toBe("pending");
    expect((await stats(juancho)).goals).toBe(0);
  });

  it("rechaza finalizar un partido que no existe", async () => {
    expect(await finish(lineup(), adminToken, "no-existe")).toEqual({ ok: false, error: "El partido no existe." });
  });
});

describe("corregir un partido finalizado", () => {
  let matchId: string;
  let pepe: string;

  // Finalizado 2 a 1: Juancho (A) hizo los 2 goles; Beto (B) hizo 1 y Pepe (B) ninguno.
  const finished = (): CorrectMatchInput => ({
    date: "2026-03-17",
    place: "Cancha 1",
    teamA: [scoredPlayer(juancho, 2)],
    teamB: [scoredPlayer(beto, 1), scoredPlayer(pepe)],
  });
  const correct = (input: CorrectMatchInput, token = adminToken) =>
    correctMatchAction(token, organizationId, matchId, input);

  beforeEach(async () => {
    pepe = (await unwrap(createPlayerAction(adminToken, organizationId, { name: "José Gómez", nickname: "Pepe" }))).id;
    const lineup = { ...baseMatch(), teamB: [player(beto), player(pepe)] };
    matchId = (await unwrap(createMatchAction(adminToken, organizationId, lineup))).id;
    const { teamA, teamB } = finished();
    await unwrap(finishMatchAction(adminToken, organizationId, matchId, { teamA, teamB }));
  });

  it("corrige los goles y recalcula marcador y estadísticas (AC-51a)", async () => {
    // Juancho quedó con 6 goles y 1 victoria en total.
    await setStats(juancho, { goals: 6 });

    await unwrap(correct({ ...finished(), teamA: [scoredPlayer(juancho, 1)] }));

    expect(await matchDoc(matchId)).toMatchObject({ scoreA: 1, scoreB: 1 });
    expect(await stats(juancho)).toEqual({ matches: 1, goals: 5, wins: 0, draws: 1, losses: 0 });
    expect(await stats(beto)).toEqual({ matches: 1, goals: 1, wins: 0, draws: 1, losses: 0 });
  });

  it("quitar a un jugador/a le resta el partido y la victoria (AC-51b)", async () => {
    // Pepe, del equipo ganador sin goles propios, tenía 8 partidos y 3 victorias.
    const pepeWins = { ...finished(), teamA: [scoredPlayer(juancho, 2), scoredPlayer(pepe)], teamB: [scoredPlayer(beto, 1)] };
    await unwrap(correct(pepeWins));
    await setStats(pepe, { matches: 8, wins: 3, losses: 0 });

    await unwrap(correct({ ...pepeWins, teamA: [scoredPlayer(juancho, 2)] }));

    expect(await stats(pepe)).toMatchObject({ matches: 7, wins: 2, losses: 0 });
  });

  it("corrige el lugar (AC-51c)", async () => {
    await unwrap(correct({ ...finished(), place: "Cancha 2" }));

    expect((await matchDoc(matchId))?.place).toBe("Cancha 2");
  });

  it("corrige el día", async () => {
    await unwrap(correct({ ...finished(), date: "2026-03-10" }));

    expect((await matchDoc(matchId))?.date).toBe("2026-03-10");
    expect((await stats(juancho)).matches).toBe(1);
  });

  it("rechaza goles negativos y deja todo sin cambios (AC-51d)", async () => {
    const before = await matchDoc(matchId);

    const result = await correct({ ...finished(), teamA: [scoredPlayer(juancho, -1)] });

    expect(result).toEqual({ ok: false, error: "Los goles tienen que ser números enteros mayores o iguales a 0." });
    expect(await matchDoc(matchId)).toEqual(before);
    expect(await stats(juancho)).toEqual({ matches: 1, goals: 2, wins: 1, draws: 0, losses: 0 });
  });

  it("agregar un externo/a con 1 gol suma al marcador pero no le registra estadísticas (AC-92)", async () => {
    // Primero queda 1 a 1.
    await unwrap(correct({ ...finished(), teamA: [scoredPlayer(juancho, 1)] }));

    await unwrap(correct({ ...finished(), teamA: [scoredPlayer(juancho, 1), scoredExternal("Tano", 1)] }));

    expect(await matchDoc(matchId)).toMatchObject({ scoreA: 2, scoreB: 1 });
    expect(await stats(juancho)).toEqual({ matches: 1, goals: 1, wins: 1, draws: 0, losses: 0 });
    const players = await adminDb.collection(`organizations/${organizationId}/players`).get();
    expect(players.size).toBe(3);
  });

  it("sumar a un jugador/a que no estaba le suma el partido", async () => {
    const lucho = (await unwrap(createPlayerAction(adminToken, organizationId, { name: "Luis Paz", nickname: "Lucho" }))).id;

    await unwrap(correct({ ...finished(), teamB: [...finished().teamB, scoredPlayer(lucho)] }));

    expect(await stats(lucho)).toEqual({ matches: 1, goals: 0, wins: 0, draws: 0, losses: 1 });
  });

  it("no cuenta de nuevo el partido en la organización", async () => {
    await unwrap(correct({ ...finished(), place: "Cancha 2" }));

    expect((await adminDb.doc(`organizations/${organizationId}`).get()).get("finishedMatchCount")).toBe(1);
  });

  it("aplica las validaciones del alta: equipo vacío, lugar y repetidos (RF-06k)", async () => {
    expect((await correct({ ...finished(), teamB: [] })).ok).toBe(false);
    expect(await correct({ ...finished(), place: " " })).toEqual({ ok: false, error: "El partido tiene que tener un lugar." });
    expect((await correct({ ...finished(), teamB: [scoredPlayer(juancho)] })).ok).toBe(false);
    const longNickname = scoredExternal("a".repeat(41));
    expect((await correct({ ...finished(), teamA: [scoredPlayer(juancho), longNickname] })).ok).toBe(false);
    expect((await correct({ ...finished(), teamB: [scoredPlayer("de-otra-org")] })).ok).toBe(false);
    expect(await stats(juancho)).toEqual({ matches: 1, goals: 2, wins: 1, draws: 0, losses: 0 });
  });

  it("rechaza pasarlo a un día que todavía no llegó (RF-08h)", async () => {
    const result = await correct({ ...finished(), date: "2099-01-01" });

    expect(result).toEqual({ ok: false, error: "Un partido finalizado no puede ser de un día que todavía no llegó." });
  });

  it("un usuario que no es admin no puede corregirlo (AC-05e)", async () => {
    const result = await correct({ ...finished(), teamA: [scoredPlayer(juancho, 9)] }, otherToken);

    expect(result).toEqual({ ok: false, error: "Solo el administrador/a de la organización puede hacer esto." });
    expect((await stats(juancho)).goals).toBe(2);
  });

  it("no corrige un partido pendiente", async () => {
    const pending = (await unwrap(createMatchAction(adminToken, organizationId, baseMatch()))).id;

    const result = await correctMatchAction(adminToken, organizationId, pending, finished());

    expect(result).toEqual({ ok: false, error: "El partido todavía no está finalizado." });
  });
});

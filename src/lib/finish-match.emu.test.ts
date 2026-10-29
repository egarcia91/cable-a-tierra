import { beforeEach, describe, expect, it } from "vitest";
import { adminDb } from "@/lib/firebase/admin";
import { clearFirestore } from "@/test/emulator";
import { createMatch, finishMatch, getMatch } from "./matches";
import { createOrganization } from "./organizations";
import { createPlayer, listPlayers } from "./players";

const ADMIN = "uid-admin";
let orgId: string;
let juan: string;
let pepe: string;

const stats = async (playerId: string) => (await listPlayers(orgId, null)).find((p) => p.id === playerId)!;
const orgDoc = () => adminDb.doc(`organizations/${orgId}`).get();

// Juan (equipo A) contra Pepe (equipo B); opcionalmente un externo/a en el equipo A.
const newMatch = (withExternal = false) =>
  createMatch(ADMIN, orgId, {
    date: "2026-10-16",
    place: "Club",
    teamA: [{ playerId: juan, nickname: "" }, ...(withExternal ? [{ playerId: null, nickname: "Tano" }] : [])],
    teamB: [{ playerId: pepe, nickname: "" }],
  });

const finish = (matchId: string, goalsA: number[], goalsB: number[], ownGoalsA = 0, ownGoalsB = 0) =>
  finishMatch(ADMIN, orgId, matchId, { goalsA, goalsB, ownGoalsA, ownGoalsB });

beforeEach(async () => {
  await clearFirestore();
  orgId = await createOrganization(ADMIN, { name: "Los Pibes", description: "" });
  juan = await createPlayer(ADMIN, orgId, { fullName: "Juan Pérez", nickname: "Juancho", birthDate: "1990-05-10" });
  pepe = await createPlayer(ADMIN, orgId, { fullName: "José Gómez", nickname: "Pepe", birthDate: "1988-01-20" });
});

describe("finishMatch", () => {
  it("con 7 partidos queda con 8 (AC-01)", async () => {
    await adminDb.doc(`organizations/${orgId}/players/${juan}`).update({ matches: 7 });
    await finish(await newMatch(), [0], [0]);
    expect((await stats(juan)).matches).toBe(8);
  });

  it("con 4 goles y 2 convertidos queda con 6 (AC-02)", async () => {
    await adminDb.doc(`organizations/${orgId}/players/${juan}`).update({ goals: 4 });
    await finish(await newMatch(), [2], [0]);
    expect((await stats(juan)).goals).toBe(6);
  });

  it("gana 5 a 3: 1 victoria (AC-03a); el rival, 1 derrota", async () => {
    await finish(await newMatch(), [5], [3]);
    expect(await stats(juan)).toMatchObject({ wins: 1, draws: 0, losses: 0 });
    expect(await stats(pepe)).toMatchObject({ wins: 0, draws: 0, losses: 1 });
  });

  it("empata 3 a 3: 1 empate (AC-03b)", async () => {
    await finish(await newMatch(), [3], [3]);
    expect(await stats(juan)).toMatchObject({ wins: 0, draws: 1, losses: 0 });
    expect(await stats(pepe)).toMatchObject({ wins: 0, draws: 1, losses: 0 });
  });

  it("pierde 3 a 5: 1 derrota (AC-03c)", async () => {
    await finish(await newMatch(), [3], [5]);
    expect(await stats(juan)).toMatchObject({ wins: 0, draws: 0, losses: 1 });
  });

  it("queda finalizado con marcador 2 a 1 y los goles de cada uno (AC-53)", async () => {
    const id = await newMatch();
    await finish(id, [2], [1]);

    expect(await getMatch(orgId, id)).toMatchObject({
      status: "finished",
      scoreA: 2,
      scoreB: 1,
      teamA: [{ playerId: juan, nickname: "Juancho", goals: 2, external: false }],
      teamB: [{ playerId: pepe, nickname: "Pepe", goals: 1, external: false }],
    });
  });

  it("el gol en contra suma al rival y no se acredita a nadie (AC-15)", async () => {
    const id = await newMatch();
    await finish(id, [0], [0], 1, 0); // el equipo A hizo un gol en contra

    expect(await getMatch(orgId, id)).toMatchObject({ scoreA: 0, scoreB: 1 });
    expect((await stats(juan)).goals).toBe(0);
    expect(await stats(pepe)).toMatchObject({ goals: 0, wins: 1 });
  });

  it("los goles del externo/a suman al marcador pero no generan estadísticas (AC-23b)", async () => {
    const id = await newMatch(true);
    await finish(id, [0, 2], [0]);

    expect(await getMatch(orgId, id)).toMatchObject({ scoreA: 2, scoreB: 0 });
    expect(await stats(juan)).toMatchObject({ matches: 1, goals: 0, wins: 1 });
    expect(await listPlayers(orgId, null)).toHaveLength(2); // al externo/a no se lo crea como jugador/a
  });

  it("suma 1 a los partidos finalizados de la organización", async () => {
    await finish(await newMatch(), [1], [0]);
    expect((await orgDoc()).get("finishedMatchCount")).toBe(1);
  });

  it("un partido finalizado no se vuelve a finalizar ni cambia nada (AC-51)", async () => {
    const id = await newMatch();
    await finish(id, [1], [0]);

    await expect(finish(id, [5], [0])).rejects.toThrow(/ya está finalizado/);
    expect(await getMatch(orgId, id)).toMatchObject({ scoreA: 1, scoreB: 0 });
    expect(await stats(juan)).toMatchObject({ matches: 1, goals: 1 });
    expect((await orgDoc()).get("finishedMatchCount")).toBe(1);
  });

  it("dos finalizaciones simultáneas suman una sola vez", async () => {
    const id = await newMatch();
    const results = await Promise.allSettled([finish(id, [1], [0]), finish(id, [1], [0])]);

    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await stats(juan)).toMatchObject({ matches: 1, goals: 1 });
  });

  it("rechaza si quien finaliza no es el admin (AC-05b)", async () => {
    const id = await newMatch();
    await expect(
      finishMatch("uid-otro", orgId, id, { goalsA: [1], goalsB: [0], ownGoalsA: 0, ownGoalsB: 0 }),
    ).rejects.toThrow(/admin/);
    expect((await getMatch(orgId, id))?.status).toBe("pending");
  });

  it("rechaza goles que no coinciden con los equipos o son inválidos, sin tocar nada", async () => {
    const id = await newMatch();
    await expect(finish(id, [1, 1], [0])).rejects.toThrow(/no coinciden/);
    await expect(finish(id, [-1], [0])).rejects.toThrow(/entero/);
    await expect(finish(id, [0], [0], 1.5)).rejects.toThrow(/entero/);

    expect((await getMatch(orgId, id))?.status).toBe("pending");
    expect((await stats(juan)).matches).toBe(0);
  });
});

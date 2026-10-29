import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { DomainError } from "@/lib/domain/errors";
import { computeResult } from "@/lib/domain/result";
import { validateMatch, type LineupEntry, type MatchInput } from "@/lib/domain/validation";

export type MatchStatus = "pending" | "finished";

export interface MatchPlayer {
  playerId: string | null;
  nickname: string;
  external: boolean; // RF-20a
  goals?: number; // solo en partidos finalizados
}

export interface Match {
  id: string;
  date: string;
  place: string;
  status: MatchStatus;
  teamA: MatchPlayer[];
  teamB: MatchPlayer[];
  scoreA?: number;
  scoreB?: number;
}

type StoredPlayer = { playerId: string | null; nickname: string; goals?: number };

const toMatchPlayer = (p: StoredPlayer): MatchPlayer => ({ ...p, external: p.playerId === null });

// RF-12: del día más reciente al más antiguo. A igual día, el último cargado primero
// (se resuelve en memoria para no requerir un índice compuesto).
export async function listMatches(orgId: string): Promise<Match[]> {
  const snap = await adminDb.collection(`organizations/${orgId}/matches`).orderBy("date", "desc").get();
  const created = (d: FirebaseFirestore.DocumentSnapshot) => d.get("createdAt")?.toMillis() ?? 0;
  const docs = [...snap.docs].sort(
    (a, b) => (b.get("date") as string).localeCompare(a.get("date")) || created(b) - created(a),
  );
  return docs.map(toMatch);
}

export async function getMatch(orgId: string, matchId: string): Promise<Match | null> {
  const snap = await adminDb.doc(`organizations/${orgId}/matches/${matchId}`).get();
  return snap.exists ? toMatch(snap) : null;
}

function toMatch(d: FirebaseFirestore.DocumentSnapshot): Match {
  return {
    id: d.id,
    date: d.get("date"),
    place: d.get("place"),
    status: d.get("status"),
    teamA: (d.get("teamA") as StoredPlayer[]).map(toMatchPlayer),
    teamB: (d.get("teamB") as StoredPlayer[]).map(toMatchPlayer),
    scoreA: d.get("scoreA"),
    scoreB: d.get("scoreB"),
  };
}

export interface FinishMatchInput {
  // Goles de cada jugador/a, en el mismo orden en que está guardado cada equipo.
  goalsA: number[];
  goalsB: number[];
  // Goles en contra hechos por cada equipo: suman al rival (RF-08c).
  ownGoalsA: number;
  ownGoalsB: number;
}

// RF-08b, RF-09, RF-10, RF-11, RF-20b, RF-06g. Todo en una transacción: si dos finalizaciones
// llegan a la vez, la segunda ve el partido ya finalizado y se rechaza.
export async function finishMatch(
  actorUid: string,
  orgId: string,
  matchId: string,
  input: FinishMatchInput,
): Promise<void> {
  const orgRef = adminDb.doc(`organizations/${orgId}`);
  const matchRef = orgRef.collection("matches").doc(matchId);

  await adminDb.runTransaction(async (tx) => {
    const [org, match] = await tx.getAll(orgRef, matchRef);
    if (!org.exists) throw new DomainError("La organización no existe.");
    if (org.get("adminUid") !== actorUid) {
      throw new DomainError("Solo el admin de la organización puede finalizar partidos.");
    }
    if (!match.exists) throw new DomainError("El partido no existe.");
    if (match.get("status") !== "pending") throw new DomainError("El partido ya está finalizado.");

    const stored = { A: match.get("teamA") as StoredPlayer[], B: match.get("teamB") as StoredPlayer[] };
    if (input.goalsA.length !== stored.A.length || input.goalsB.length !== stored.B.length) {
      throw new DomainError("Los goles no coinciden con los jugadores/as del partido.");
    }
    const teamA = stored.A.map((p, i) => ({ playerId: p.playerId, nickname: p.nickname, goals: input.goalsA[i] }));
    const teamB = stored.B.map((p, i) => ({ playerId: p.playerId, nickname: p.nickname, goals: input.goalsB[i] }));

    const { scoreA, scoreB, deltas } = computeResult({
      teamA,
      teamB,
      ownGoalsA: input.ownGoalsA,
      ownGoalsB: input.ownGoalsB,
    });

    tx.update(matchRef, {
      status: "finished" satisfies MatchStatus,
      teamA,
      teamB,
      ownGoalsA: input.ownGoalsA,
      ownGoalsB: input.ownGoalsB,
      scoreA,
      scoreB,
      finishedAt: FieldValue.serverTimestamp(),
    });
    for (const [playerId, d] of deltas) {
      tx.update(orgRef.collection("players").doc(playerId), {
        matches: FieldValue.increment(d.matches),
        goals: FieldValue.increment(d.goals),
        wins: FieldValue.increment(d.wins),
        draws: FieldValue.increment(d.draws),
        losses: FieldValue.increment(d.losses),
      });
    }
    tx.update(orgRef, { finishedMatchCount: FieldValue.increment(1) });
  });
}

// RF-08a, RF-08d, RF-08e, RF-06d.
export async function createMatch(actorUid: string, orgId: string, input: MatchInput): Promise<string> {
  const { date, place, teamA, teamB } = validateMatch(input);
  const orgRef = adminDb.doc(`organizations/${orgId}`);

  const org = await orgRef.get();
  if (!org.exists) throw new DomainError("La organización no existe.");
  if (org.get("adminUid") !== actorUid) {
    throw new DomainError("Solo el admin de la organización puede dar de alta partidos.");
  }

  // Los jugadores/as de la organización tienen que existir en ella; su apodo sale de la base,
  // no del formulario. Los externos/as (playerId null) se guardan con el apodo cargado.
  const memberIds = [...teamA, ...teamB].flatMap((p) => (p.playerId ? [p.playerId] : []));
  const snaps = memberIds.length
    ? await adminDb.getAll(...memberIds.map((id) => orgRef.collection("players").doc(id)))
    : [];
  const nicknames = new Map<string, string>();
  for (const snap of snaps) {
    if (!snap.exists) throw new DomainError("Uno de los jugadores/as no pertenece a la organización.");
    nicknames.set(snap.id, snap.get("nickname"));
  }
  const resolve = (team: LineupEntry[]) =>
    team.map((p) => ({ playerId: p.playerId, nickname: p.playerId ? nicknames.get(p.playerId)! : p.nickname }));

  const ref = await orgRef.collection("matches").add({
    date,
    place,
    status: "pending" satisfies MatchStatus,
    teamA: resolve(teamA),
    teamB: resolve(teamB),
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

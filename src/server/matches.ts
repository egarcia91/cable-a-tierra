import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { todayInArgentina } from "@/lib/dates";
import { adminDb } from "@/lib/firebase/admin";
import { computeScore, statChanges, type StatLine } from "@/lib/match-stats";
import type { TeamEntry, ValidFinishMatch, ValidMatch } from "@/lib/validation/match";
import { UserError } from "./errors";
import { getOrganizationAsAdmin } from "./organizations";

const organizationRef = (organizationId: string) => adminDb.collection("organizations").doc(organizationId);
const matchesOf = (organizationId: string) => organizationRef(organizationId).collection("matches");
const playersOf = (organizationId: string) => organizationRef(organizationId).collection("players");

/** Los jugadores/as elegidos tienen que ser de la organización; si no, van como externos/as (RF-08a). */
async function assertPlayersBelong(tx: Transaction, organizationId: string, match: ValidMatch): Promise<void> {
  const ids = [...match.teamA, ...match.teamB].flatMap((e) => (e.type === "player" ? [e.playerId] : []));
  if (ids.length === 0) return;
  const snaps = await tx.getAll(...ids.map((id) => playersOf(organizationId).doc(id)));
  if (snaps.some((s) => !s.exists)) {
    throw new UserError("Hay jugadores/as que no son de esta organización.");
  }
}

/** Da de alta un partido pendiente (RF-08a). Pendiente no suma estadísticas. */
export async function createMatch(user: DecodedIdToken, organizationId: string, input: ValidMatch): Promise<string> {
  const ref = matchesOf(organizationId).doc();
  await adminDb.runTransaction(async (tx) => {
    await getOrganizationAsAdmin(tx, organizationId, user.uid);
    await assertPlayersBelong(tx, organizationId, input);
    tx.create(ref, {
      date: input.date,
      place: input.place,
      teamA: input.teamA,
      teamB: input.teamB,
      status: "pending",
      // El momento de alta desempata los partidos del mismo día (RF-12c).
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return ref.id;
}

/** Edita día, lugar y equipos de un partido pendiente (RF-06b). */
export async function updatePendingMatch(
  user: DecodedIdToken,
  organizationId: string,
  matchId: string,
  input: ValidMatch,
): Promise<void> {
  const ref = matchesOf(organizationId).doc(matchId);
  await adminDb.runTransaction(async (tx) => {
    await getOrganizationAsAdmin(tx, organizationId, user.uid);
    const match = await tx.get(ref);
    if (!match.exists) throw new UserError("El partido no existe.");
    // Un partido finalizado se cambia con la corrección, que recalcula las estadísticas.
    if (match.get("status") !== "pending") throw new UserError("El partido ya está finalizado.");
    await assertPlayersBelong(tx, organizationId, input);
    tx.update(ref, {
      date: input.date,
      place: input.place,
      teamA: input.teamA,
      teamB: input.teamB,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

/** Suma (o resta, si son negativos) los cambios de estadísticas de cada jugador/a (RF-22). */
function applyStatChanges(tx: Transaction, organizationId: string, changes: Map<string, StatLine>): void {
  for (const [playerId, change] of changes) {
    tx.update(
      playersOf(organizationId).doc(playerId),
      Object.fromEntries(Object.entries(change).map(([field, n]) => [field, FieldValue.increment(n)])),
    );
  }
}

/** Identifica un lugar del equipo sin sus goles, para comparar alineaciones. */
const entryKey = (e: TeamEntry) => (e.type === "player" ? `player:${e.playerId}` : `external:${e.nickname}`);
const sameTeam = (a: TeamEntry[], b: TeamEntry[]) =>
  a.length === b.length && a.every((entry, i) => entryKey(entry) === entryKey(b[i]));

export const FUTURE_MATCH_ERROR = "No se puede finalizar un partido de un día que todavía no llegó.";

/**
 * Finaliza un partido pendiente con los goles de cada uno: suma partidos, goles,
 * victorias, empates y derrotas a los jugadores/as de la organización (RF-08b,
 * RF-09 a RF-11, RF-20b) y cuenta el partido en la organización. Todo o nada.
 */
export async function finishMatch(
  user: DecodedIdToken,
  organizationId: string,
  matchId: string,
  input: ValidFinishMatch,
): Promise<void> {
  const ref = matchesOf(organizationId).doc(matchId);
  await adminDb.runTransaction(async (tx) => {
    const organization = await getOrganizationAsAdmin(tx, organizationId, user.uid);
    const match = await tx.get(ref);
    if (!match.exists) throw new UserError("El partido no existe.");
    if (match.get("status") !== "pending") throw new UserError("El partido ya está finalizado."); // RF-23
    if (match.get("date") > todayInArgentina()) throw new UserError(FUTURE_MATCH_ERROR); // RF-08h
    // Si alguien editó el partido mientras se cargaban los goles, no se adivina a quién van.
    if (!sameTeam(match.get("teamA"), input.teamA) || !sameTeam(match.get("teamB"), input.teamB)) {
      throw new UserError("El partido cambió mientras cargabas los goles. Volvé a abrirlo.");
    }

    applyStatChanges(tx, organizationId, statChanges(null, input));
    const score = computeScore(input);
    tx.update(ref, {
      teamA: input.teamA,
      teamB: input.teamB,
      scoreA: score.a,
      scoreB: score.b,
      status: "finished",
      finishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    // Ordena el listado de organizaciones (RF-16a).
    tx.update(organization.ref, { finishedMatchCount: FieldValue.increment(1) });
  });
}

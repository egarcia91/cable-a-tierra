import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import type { ValidMatch } from "@/lib/validation/match";
import { UserError } from "./errors";
import { getOrganizationAsAdmin } from "./organizations";

const matchesOf = (organizationId: string) =>
  adminDb.collection("organizations").doc(organizationId).collection("matches");

/** Los jugadores/as elegidos tienen que ser de la organización; si no, van como externos/as (RF-08a). */
async function assertPlayersBelong(tx: Transaction, organizationId: string, match: ValidMatch): Promise<void> {
  const ids = [...match.teamA, ...match.teamB].flatMap((e) => (e.type === "player" ? [e.playerId] : []));
  if (ids.length === 0) return;
  const players = adminDb.collection("organizations").doc(organizationId).collection("players");
  const snaps = await tx.getAll(...ids.map((id) => players.doc(id)));
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

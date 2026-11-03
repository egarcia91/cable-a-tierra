import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { sortKey } from "@/lib/sort-key";
import { MAX_PLAYERS_PER_ORGANIZATION, type ValidPlayer } from "@/lib/validation/player";
import { UserError } from "./errors";
import { getOrganizationAsAdmin } from "./organizations";

// Cada jugador/a se guarda en dos documentos:
// - players/{id}: público (apodo y estadísticas), lo ve cualquiera (RF-04d).
// - players/{id}/private/data: nombre y fecha de nacimiento, solo para miembros (RF-04c).
const playersOf = (organizationId: string) =>
  adminDb.collection("organizations").doc(organizationId).collection("players");

const privateOf = (organizationId: string, playerId: string) =>
  playersOf(organizationId).doc(playerId).collection("private").doc("data");

/**
 * Crea un jugador/a con las estadísticas en 0 (RF-05, RF-07a). Rechaza si la
 * organización ya tiene 40 (RF-07e): el contador se lee y se incrementa en la
 * misma transacción para que dos altas simultáneas no pasen el límite.
 */
export async function createPlayer(user: DecodedIdToken, organizationId: string, input: ValidPlayer): Promise<string> {
  const ref = playersOf(organizationId).doc();
  await adminDb.runTransaction(async (tx) => {
    const organization = await getOrganizationAsAdmin(tx, organizationId, user.uid);
    if ((organization.get("playerCount") as number) >= MAX_PLAYERS_PER_ORGANIZATION) {
      throw new UserError(`La organización ya tiene ${MAX_PLAYERS_PER_ORGANIZATION} jugadores/as.`);
    }
    tx.create(ref, {
      nickname: input.nickname,
      nicknameSort: sortKey(input.nickname),
      matches: 0,
      goals: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      linkedUid: null,
      createdAt: FieldValue.serverTimestamp(),
    });
    tx.create(privateOf(organizationId, ref.id), { name: input.name, birthDate: input.birthDate });
    tx.update(organization.ref, { playerCount: FieldValue.increment(1) });
  });
  return ref.id;
}

/** Edita nombre, apodo y fecha de nacimiento; nunca las estadísticas (RF-15, RF-22). */
export async function updatePlayer(
  user: DecodedIdToken,
  organizationId: string,
  playerId: string,
  input: ValidPlayer,
): Promise<void> {
  const ref = playersOf(organizationId).doc(playerId);
  await adminDb.runTransaction(async (tx) => {
    await getOrganizationAsAdmin(tx, organizationId, user.uid);
    if (!(await tx.get(ref)).exists) throw new UserError("El jugador/a no existe.");
    tx.update(ref, { nickname: input.nickname, nicknameSort: sortKey(input.nickname) });
    tx.set(privateOf(organizationId, playerId), { name: input.name, birthDate: input.birthDate });
  });
}

/**
 * Asocia la cuenta registrada con ese email a un jugador/a (RF-07b) y la suma a
 * los miembros de la organización, que pueden ver los datos privados (RF-04c).
 *
 * - El email tiene que ser de una cuenta registrada (RF-07f).
 * - El jugador/a no puede tener ya una cuenta (RF-07d).
 * - La cuenta no puede estar asociada a otro jugador/a de la misma organización
 *   (RF-07c), pero sí a jugadores/as de otras (RF-21). Para garantizarlo aunque
 *   haya dos asociaciones a la vez, se crea accountLinks/{uid} en la transacción:
 *   si ya existe, la transacción falla.
 */
export async function linkPlayerAccount(
  user: DecodedIdToken,
  organizationId: string,
  playerId: string,
  email: string,
): Promise<void> {
  const users = await adminDb.collection("users").where("email", "==", email).limit(1).get();
  if (users.empty) throw new UserError("No hay ninguna cuenta registrada con ese email.");
  const accountUid = users.docs[0].id;

  const playerRef = playersOf(organizationId).doc(playerId);
  const linkRef = adminDb.doc(`organizations/${organizationId}/accountLinks/${accountUid}`);

  await adminDb.runTransaction(async (tx) => {
    const organization = await getOrganizationAsAdmin(tx, organizationId, user.uid);
    const [player, link] = await Promise.all([tx.get(playerRef), tx.get(linkRef)]);
    if (!player.exists) throw new UserError("El jugador/a no existe.");
    if (player.get("linkedUid")) throw new UserError("El jugador/a ya tiene una cuenta asociada.");
    if (link.exists) {
      throw new UserError("Esa cuenta ya está asociada a otro jugador/a de esta organización.");
    }

    tx.create(linkRef, { playerId });
    tx.update(playerRef, { linkedUid: accountUid });
    tx.update(organization.ref, { memberUids: FieldValue.arrayUnion(accountUid) });
  });
}

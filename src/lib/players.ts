import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { DomainError } from "@/lib/domain/errors";
import { assertCanAddPlayer, validatePlayer, type PlayerInput } from "@/lib/domain/validation";

export interface PlayerStats {
  matches: number;
  goals: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface Player extends PlayerStats {
  id: string;
  nickname: string;
  // Solo presentes cuando quien mira es miembro de la organización (RF-04c, RF-04d).
  fullName?: string;
  birthDate?: string;
}

const ZERO_STATS: PlayerStats = { matches: 0, goals: 0, wins: 0, draws: 0, losses: 0 };

// RF-07a, RF-06c, RF-07e. La transacción evita que dos altas simultáneas pasen el tope de 40.
export async function createPlayer(actorUid: string, orgId: string, input: PlayerInput): Promise<string> {
  const { fullName, nickname, birthDate } = validatePlayer(input);
  const orgRef = adminDb.doc(`organizations/${orgId}`);
  const playerRef = orgRef.collection("players").doc();

  await adminDb.runTransaction(async (tx) => {
    const org = await tx.get(orgRef);
    if (!org.exists) throw new DomainError("La organización no existe.");
    if (org.get("adminUid") !== actorUid) {
      throw new DomainError("Solo el admin de la organización puede crear jugadores/as.");
    }
    assertCanAddPlayer(org.get("playerCount"));

    tx.create(playerRef, { nickname, ...ZERO_STATS, createdAt: FieldValue.serverTimestamp() });
    tx.create(playerRef.collection("private").doc("data"), { fullName, birthDate });
    tx.update(orgRef, { playerCount: FieldValue.increment(1) });
  });

  return playerRef.id;
}

// El Admin SDK ignora las Security Rules, así que acá se decide qué ve cada uno.
export async function listPlayers(orgId: string, viewerUid: string | null): Promise<Player[]> {
  const orgRef = adminDb.doc(`organizations/${orgId}`);
  const [org, snap] = await Promise.all([orgRef.get(), orgRef.collection("players").orderBy("nickname").get()]);
  const isMember = viewerUid !== null && org.get("adminUid") === viewerUid;

  const players: Player[] = snap.docs.map((d) => ({
    id: d.id,
    nickname: d.get("nickname"),
    matches: d.get("matches"),
    goals: d.get("goals"),
    wins: d.get("wins"),
    draws: d.get("draws"),
    losses: d.get("losses"),
  }));
  if (!isMember || players.length === 0) return players;

  const privates = await adminDb.getAll(...snap.docs.map((d) => d.ref.collection("private").doc("data")));
  return players.map((p, i) => ({
    ...p,
    fullName: privates[i].get("fullName"),
    birthDate: privates[i].get("birthDate"),
  }));
}

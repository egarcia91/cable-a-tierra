import type { ScoredTeamEntry, TeamEntry } from "@/lib/validation/match";

export type { ScoredTeamEntry, TeamEntry };

/** Datos públicos de una organización (organizations/{id}). */
export type Organization = {
  id: string;
  name: string;
  description: string | null;
  adminUid: string;
  memberUids: string[];
  playerCount: number;
  finishedMatchCount: number;
};

/** Datos públicos de un jugador/a (organizations/{id}/players/{playerId}). */
export type Player = {
  id: string;
  nickname: string;
  matches: number;
  goals: number;
  wins: number;
  draws: number;
  losses: number;
  linkedUid: string | null;
};

/** Datos que solo ven los miembros de la organización (playersPrivate/{playerId}). */
export type PlayerPrivate = {
  name: string;
  birthDate: string | null;
};

/**
 * Un partido (organizations/{id}/matches/{matchId}). Al finalizarse, cada lugar
 * de los equipos guarda sus goles y queda el marcador.
 */
export type Match = { id: string; date: string; place: string } & (
  | { status: "pending"; teamA: TeamEntry[]; teamB: TeamEntry[] }
  | { status: "finished"; teamA: ScoredTeamEntry[]; teamB: ScoredTeamEntry[]; scoreA: number; scoreB: number }
);

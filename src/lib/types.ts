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

/** Datos que solo ven los miembros de la organización (players/{playerId}/private/data). */
export type PlayerPrivate = {
  name: string;
  birthDate: string | null;
};

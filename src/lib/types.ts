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

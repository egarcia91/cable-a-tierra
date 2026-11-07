import { sortKey } from "./sort-key";
import type { Player } from "./types";

export const PLAYER_SORT_OPTIONS = [
  { value: "matches", label: "Partidos" },
  { value: "goals", label: "Goles" },
  { value: "wins", label: "Victorias" },
  { value: "draws", label: "Empates" },
  { value: "losses", label: "Derrotas" },
] as const;

export type PlayerSortCriterion = (typeof PLAYER_SORT_OPTIONS)[number]["value"];

/** Por defecto, por cantidad de partidos (RF-14b). */
export const DEFAULT_PLAYER_SORT: PlayerSortCriterion = "matches";

/**
 * Ordena de mayor a menor por el criterio elegido (RF-14a) y, a igual valor,
 * alfabéticamente por apodo (RF-14c). No modifica el array original.
 */
export function sortPlayers<P extends Player>(players: P[], criterion: PlayerSortCriterion): P[] {
  return [...players].sort(
    (a, b) => b[criterion] - a[criterion] || sortKey(a.nickname).localeCompare(sortKey(b.nickname)),
  );
}

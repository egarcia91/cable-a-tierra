import type { ScoredTeamEntry } from "@/lib/validation/match";

export type Score = { a: number; b: number };

export type StatLine = { matches: number; goals: number; wins: number; draws: number; losses: number };

type ScoredTeams = { teamA: ScoredTeamEntry[]; teamB: ScoredTeamEntry[] };

const sum = (team: ScoredTeamEntry[], field: "goals" | "ownGoals") => team.reduce((total, e) => total + e[field], 0);

/**
 * Marcador del partido: los goles de cada equipo, incluidos los de sus externos/as
 * (RF-20c), más los goles en contra del rival (RF-08c).
 */
export function computeScore({ teamA, teamB }: ScoredTeams): Score {
  return {
    a: sum(teamA, "goals") + sum(teamB, "ownGoals"),
    b: sum(teamB, "goals") + sum(teamA, "ownGoals"),
  };
}

/**
 * Lo que el partido suma a cada jugador/a de la organización (RF-09 a RF-11).
 * Los externos/as no suman nada (RF-20b) y los goles en contra no se acreditan (RF-08c).
 */
export function playerStats(match: ScoredTeams): Map<string, StatLine> {
  const { a, b } = computeScore(match);
  const stats = new Map<string, StatLine>();
  const add = (team: ScoredTeamEntry[], own: number, rival: number) => {
    for (const entry of team) {
      if (entry.type !== "player") continue;
      stats.set(entry.playerId, {
        matches: 1,
        goals: entry.goals,
        wins: own > rival ? 1 : 0,
        draws: own === rival ? 1 : 0,
        losses: own < rival ? 1 : 0,
      });
    }
  };
  add(match.teamA, a, b);
  add(match.teamB, b, a);
  return stats;
}

const ZERO: StatLine = { matches: 0, goals: 0, wins: 0, draws: 0, losses: 0 };
const FIELDS = Object.keys(ZERO) as (keyof StatLine)[];

/**
 * Cuánto cambia cada jugador/a al pasar de `before` a `after`: al finalizar,
 * `before` es null; al corregir, se resta lo viejo y se suma lo nuevo (RF-06j).
 * Omite a quienes no cambian.
 */
export function statChanges(before: ScoredTeams | null, after: ScoredTeams): Map<string, StatLine> {
  const old = before ? playerStats(before) : new Map<string, StatLine>();
  const now = playerStats(after);
  const changes = new Map<string, StatLine>();
  for (const id of new Set([...old.keys(), ...now.keys()])) {
    const prev = old.get(id) ?? ZERO;
    const next = now.get(id) ?? ZERO;
    const delta = Object.fromEntries(FIELDS.map((f) => [f, next[f] - prev[f]])) as StatLine;
    if (FIELDS.some((f) => delta[f] !== 0)) changes.set(id, delta);
  }
  return changes;
}

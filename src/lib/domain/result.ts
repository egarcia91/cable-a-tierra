import { DomainError } from "./errors";
import type { LineupEntry } from "./validation";

export interface ScoredEntry extends LineupEntry {
  goals: number;
}

export interface FinishInput {
  teamA: ScoredEntry[];
  teamB: ScoredEntry[];
  // Goles en contra hechos por cada equipo: suman al rival (RF-08c).
  ownGoalsA: number;
  ownGoalsB: number;
}

export interface StatDelta {
  matches: number;
  goals: number;
  wins: number;
  draws: number;
  losses: number;
}

export interface MatchResult {
  scoreA: number;
  scoreB: number;
  // Solo jugadores/as de la organización; los externos/as no suman (RF-20b).
  deltas: Map<string, StatDelta>;
}

function requireCount(n: number): number {
  if (!Number.isInteger(n) || n < 0) {
    throw new DomainError("Los goles deben ser un número entero mayor o igual a 0.");
  }
  return n;
}

const sumGoals = (team: ScoredEntry[]) => team.reduce((acc, p) => acc + requireCount(p.goals), 0);

export function computeResult(input: FinishInput): MatchResult {
  const scoreA = sumGoals(input.teamA) + requireCount(input.ownGoalsB);
  const scoreB = sumGoals(input.teamB) + requireCount(input.ownGoalsA);

  const deltas = new Map<string, StatDelta>();
  const addTeam = (team: ScoredEntry[], own: number, rival: number) => {
    for (const p of team) {
      if (!p.playerId) continue;
      deltas.set(p.playerId, {
        matches: 1,
        goals: p.goals,
        wins: own > rival ? 1 : 0,
        draws: own === rival ? 1 : 0,
        losses: own < rival ? 1 : 0,
      });
    }
  };
  addTeam(input.teamA, scoreA, scoreB);
  addTeam(input.teamB, scoreB, scoreA);

  return { scoreA, scoreB, deltas };
}

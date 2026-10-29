import { describe, expect, it } from "vitest";
import { computeResult, type ScoredEntry } from "./result";

const p = (playerId: string | null, goals = 0): ScoredEntry => ({ playerId, nickname: playerId ?? "Tano", goals });

describe("computeResult", () => {
  it("suma 1 partido y los goles de cada jugador/a (AC-01, AC-02)", () => {
    const { deltas } = computeResult({ teamA: [p("a", 2)], teamB: [p("b")], ownGoalsA: 0, ownGoalsB: 0 });
    expect(deltas.get("a")).toMatchObject({ matches: 1, goals: 2 });
    expect(deltas.get("b")).toMatchObject({ matches: 1, goals: 0 });
  });

  it("victoria 5 a 3 (AC-03a)", () => {
    const r = computeResult({ teamA: [p("a", 5)], teamB: [p("b", 3)], ownGoalsA: 0, ownGoalsB: 0 });
    expect(r.deltas.get("a")).toMatchObject({ wins: 1, draws: 0, losses: 0 });
  });

  it("empate 3 a 3 (AC-03b)", () => {
    const r = computeResult({ teamA: [p("a", 3)], teamB: [p("b", 3)], ownGoalsA: 0, ownGoalsB: 0 });
    expect(r.deltas.get("a")).toMatchObject({ wins: 0, draws: 1, losses: 0 });
    expect(r.deltas.get("b")).toMatchObject({ wins: 0, draws: 1, losses: 0 });
  });

  it("derrota 3 a 5 (AC-03c)", () => {
    const r = computeResult({ teamA: [p("a", 3)], teamB: [p("b", 5)], ownGoalsA: 0, ownGoalsB: 0 });
    expect(r.deltas.get("a")).toMatchObject({ wins: 0, draws: 0, losses: 1 });
  });

  it("marcador 2 a 1 (AC-53)", () => {
    const r = computeResult({ teamA: [p("a", 2), p("c")], teamB: [p("b", 1)], ownGoalsA: 0, ownGoalsB: 0 });
    expect([r.scoreA, r.scoreB]).toEqual([2, 1]);
  });

  it("el gol en contra suma al rival y no se acredita a nadie (AC-15)", () => {
    const r = computeResult({ teamA: [p("a")], teamB: [p("b")], ownGoalsA: 1, ownGoalsB: 0 });
    expect([r.scoreA, r.scoreB]).toEqual([0, 1]);
    expect(r.deltas.get("a")?.goals).toBe(0);
    expect(r.deltas.get("b")).toMatchObject({ goals: 0, wins: 1 });
  });

  it("los goles del externo/a suman al marcador pero no generan estadísticas (AC-23b)", () => {
    const r = computeResult({ teamA: [p("a"), p(null, 2)], teamB: [p("b")], ownGoalsA: 0, ownGoalsB: 0 });
    expect([r.scoreA, r.scoreB]).toEqual([2, 0]);
    expect([...r.deltas.keys()].sort()).toEqual(["a", "b"]);
    expect(r.deltas.get("a")?.wins).toBe(1);
  });

  it("rechaza goles negativos o no enteros", () => {
    expect(() => computeResult({ teamA: [p("a", -1)], teamB: [p("b")], ownGoalsA: 0, ownGoalsB: 0 })).toThrow();
    expect(() => computeResult({ teamA: [p("a", 1.5)], teamB: [p("b")], ownGoalsA: 0, ownGoalsB: 0 })).toThrow();
    expect(() => computeResult({ teamA: [p("a")], teamB: [p("b")], ownGoalsA: -1, ownGoalsB: 0 })).toThrow();
  });
});

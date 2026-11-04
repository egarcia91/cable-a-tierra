import { describe, expect, it } from "vitest";
import { computeScore, playerStats, statChanges } from "./match-stats";

const player = (playerId: string, goals = 0, ownGoals = 0) => ({ type: "player", playerId, goals, ownGoals }) as const;
const external = (nickname: string, goals = 0, ownGoals = 0) => ({ type: "external", nickname, goals, ownGoals }) as const;

describe("computeScore", () => {
  it("suma los goles de cada equipo (AC-53)", () => {
    expect(computeScore({ teamA: [player("juancho", 2)], teamB: [player("beto", 1)] })).toEqual({ a: 2, b: 1 });
  });

  it("suma el gol en contra al rival (AC-15)", () => {
    expect(computeScore({ teamA: [player("juancho", 2, 1)], teamB: [player("beto")] })).toEqual({ a: 2, b: 1 });
  });

  it("suma los goles de los externos/as a su equipo (AC-23c)", () => {
    expect(computeScore({ teamA: [external("Tano", 2)], teamB: [player("beto")] })).toEqual({ a: 2, b: 0 });
  });
});

describe("playerStats", () => {
  it("suma un partido, los goles y una victoria al que gana (AC-01, AC-02, AC-03a)", () => {
    const stats = playerStats({ teamA: [player("juancho", 5)], teamB: [player("beto", 3)] });
    expect(stats.get("juancho")).toEqual({ matches: 1, goals: 5, wins: 1, draws: 0, losses: 0 });
    expect(stats.get("beto")).toEqual({ matches: 1, goals: 3, wins: 0, draws: 0, losses: 1 });
  });

  it("suma un empate a los dos equipos (AC-03b)", () => {
    const stats = playerStats({ teamA: [player("juancho", 3)], teamB: [player("beto", 3)] });
    expect(stats.get("juancho")?.draws).toBe(1);
    expect(stats.get("beto")?.draws).toBe(1);
  });

  it("no acredita el gol en contra a nadie (AC-15)", () => {
    const stats = playerStats({ teamA: [player("juancho", 2, 1)], teamB: [player("beto")] });
    expect(stats.get("juancho")?.goals).toBe(2);
    expect(stats.get("beto")?.goals).toBe(0);
  });

  it("no incluye a los externos/as (AC-23b)", () => {
    const stats = playerStats({ teamA: [external("Tano", 2), player("juancho")], teamB: [player("beto")] });
    expect([...stats.keys()]).toEqual(["juancho", "beto"]);
  });
});

describe("statChanges", () => {
  it("al finalizar, es lo que suma el partido", () => {
    const match = { teamA: [player("juancho", 1)], teamB: [player("beto")] };
    expect(statChanges(null, match)).toEqual(playerStats(match));
  });

  it("al corregir los goles, cambia goles y resultado (AC-51a)", () => {
    const before = { teamA: [player("juancho", 2)], teamB: [player("beto", 1)] };
    const after = { teamA: [player("juancho", 1)], teamB: [player("beto", 1)] };
    const changes = statChanges(before, after);
    expect(changes.get("juancho")).toEqual({ matches: 0, goals: -1, wins: -1, draws: 1, losses: 0 });
    expect(changes.get("beto")).toEqual({ matches: 0, goals: 0, wins: 0, draws: 1, losses: -1 });
  });

  it("al quitar a un jugador/a, le resta el partido (AC-51b)", () => {
    const before = { teamA: [player("juancho"), player("pepe", 1)], teamB: [player("beto")] };
    const after = { teamA: [player("pepe", 1)], teamB: [player("beto")] };
    expect(statChanges(before, after)).toEqual(
      new Map([["juancho", { matches: -1, goals: 0, wins: -1, draws: 0, losses: 0 }]]),
    );
  });

  it("omite a quienes no cambian", () => {
    const match = { teamA: [player("juancho", 1)], teamB: [player("beto")] };
    expect(statChanges(match, { ...match }).size).toBe(0);
  });
});

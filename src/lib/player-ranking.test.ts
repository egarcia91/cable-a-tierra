import { describe, expect, it } from "vitest";
import { sortPlayers } from "./player-ranking";
import type { Player } from "./types";

function player(nickname: string, stats: Partial<Player> = {}): Player {
  return { id: nickname, nickname, matches: 0, goals: 0, wins: 0, draws: 0, losses: 0, linkedUid: null, ...stats };
}

const nicknames = (players: Player[]) => players.map((p) => p.nickname);

describe("sortPlayers", () => {
  it("ordena por partidos de mayor a menor (AC-29, AC-87)", () => {
    expect(nicknames(sortPlayers([player("A", { matches: 3 }), player("B", { matches: 5 })], "matches"))).toEqual([
      "B",
      "A",
    ]);
  });

  it("ordena por goles de mayor a menor (AC-07)", () => {
    expect(nicknames(sortPlayers([player("A", { goals: 3 }), player("B", { goals: 5 })], "goals"))).toEqual(["B", "A"]);
  });

  it("ordena por victorias, empates o derrotas (AC-30, AC-31, AC-32)", () => {
    for (const criterion of ["wins", "draws", "losses"] as const) {
      const players = [player("A", { [criterion]: 3 }), player("B", { [criterion]: 5 })];
      expect(nicknames(sortPlayers(players, criterion))).toEqual(["B", "A"]);
    }
  });

  it("desempata alfabéticamente por apodo (AC-88)", () => {
    expect(nicknames(sortPlayers([player("Tano", { goals: 4 }), player("Beto", { goals: 4 })], "goals"))).toEqual([
      "Beto",
      "Tano",
    ]);
  });

  it("desempata sin distinguir mayúsculas ni tildes", () => {
    const players = [player("zorro"), player("Ángel"), player("Beto")];
    expect(nicknames(sortPlayers(players, "matches"))).toEqual(["Ángel", "Beto", "zorro"]);
  });

  it("no modifica el array original", () => {
    const players = [player("A", { goals: 1 }), player("B", { goals: 2 })];
    sortPlayers(players, "goals");
    expect(nicknames(players)).toEqual(["A", "B"]);
  });
});

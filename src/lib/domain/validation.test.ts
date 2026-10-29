import { describe, expect, it } from "vitest";
import {
  assertCanAddPlayer,
  parseLineup,
  validateMatch,
  validateOrganization,
  validatePlayer,
} from "./validation";

const player = { fullName: "Juan Pérez", nickname: "Juancho", birthDate: "1990-05-10" };
const x = (n: number) => "x".repeat(n);

describe("validateOrganization", () => {
  it("acepta nombre y descripción, recortando espacios", () => {
    expect(validateOrganization({ name: " Los Pibes ", description: " Martes 21 h " })).toEqual({
      name: "Los Pibes",
      description: "Martes 21 h",
    });
  });

  it("la descripción es opcional", () => {
    expect(validateOrganization({ name: "Los Pibes", description: "" }).description).toBe("");
  });

  it("exige nombre y limita largos", () => {
    expect(() => validateOrganization({ name: " ", description: "" })).toThrow(/obligatorio/);
    expect(() => validateOrganization({ name: x(61), description: "" })).toThrow(/60/);
    expect(() => validateOrganization({ name: "A", description: x(301) })).toThrow(/300/);
  });
});

describe("validatePlayer", () => {
  it("acepta un jugador/a válido (AC-04)", () => {
    expect(validatePlayer(player)).toEqual(player);
  });

  it("recorta espacios", () => {
    expect(validatePlayer({ ...player, nickname: "  Juancho " }).nickname).toBe("Juancho");
  });

  it("acepta nombre de 40 caracteres y rechaza 41 (AC-22a, AC-22b)", () => {
    expect(() => validatePlayer({ ...player, fullName: x(40) })).not.toThrow();
    expect(() => validatePlayer({ ...player, fullName: x(41) })).toThrow(/nombre/);
  });

  it("acepta apodo de 40 caracteres y rechaza 41 (AC-45, AC-46)", () => {
    expect(() => validatePlayer({ ...player, nickname: x(40) })).not.toThrow();
    expect(() => validatePlayer({ ...player, nickname: x(41) })).toThrow(/apodo/);
  });

  it("cuenta caracteres con tilde como uno solo", () => {
    expect(() => validatePlayer({ ...player, fullName: "ñ".repeat(40) })).not.toThrow();
  });

  it("rechaza textos vacíos", () => {
    expect(() => validatePlayer({ ...player, fullName: "   " })).toThrow(/obligatorio/);
  });

  it("acepta 01/01/1920 y rechaza 31/12/1919 (AC-47, AC-48)", () => {
    expect(() => validatePlayer({ ...player, birthDate: "1920-01-01" })).not.toThrow();
    expect(() => validatePlayer({ ...player, birthDate: "1919-12-31" })).toThrow(/1920/);
  });

  it("rechaza fechas inválidas o futuras", () => {
    expect(() => validatePlayer({ ...player, birthDate: "1990-02-30" })).toThrow(/válida/);
    expect(() => validatePlayer({ ...player, birthDate: "10/05/1990" })).toThrow(/válida/);
    expect(() => validatePlayer({ ...player, birthDate: "2999-01-01" })).toThrow(/futura/);
  });
});

describe("assertCanAddPlayer", () => {
  it("acepta con 39 y rechaza con 40 (AC-36, AC-37)", () => {
    expect(() => assertCanAddPlayer(39)).not.toThrow();
    expect(() => assertCanAddPlayer(40)).toThrow(/40/);
  });
});

describe("validateMatch", () => {
  const match = {
    date: "2026-10-16",
    place: "Club Atlético",
    teamA: [{ playerId: "p1", nickname: "Juancho" }],
    teamB: [{ playerId: "p2", nickname: "Pepe" }],
  };

  it("acepta un partido válido", () => {
    expect(validateMatch(match)).toEqual(match);
  });

  it("rechaza un equipo sin jugadores/as (AC-54)", () => {
    expect(() => validateMatch({ ...match, teamB: [] })).toThrow(/equipo B/);
  });

  it("acepta un jugador/a externo/a con solo su apodo (AC-55)", () => {
    const result = validateMatch({ ...match, teamA: [...match.teamA, { playerId: null, nickname: "Tano" }] });
    expect(result.teamA).toContainEqual({ playerId: null, nickname: "Tano" });
  });

  it("exige apodo al externo/a pero no al jugador/a de la organización", () => {
    expect(() => validateMatch({ ...match, teamA: [{ playerId: "p1", nickname: "" }] })).not.toThrow();
    expect(() => validateMatch({ ...match, teamA: [{ playerId: null, nickname: " " }] })).toThrow(/externo/);
  });

  it("rechaza al mismo jugador/a en los dos equipos", () => {
    expect(() => validateMatch({ ...match, teamB: [...match.teamB, match.teamA[0]] })).toThrow(/dos veces/);
  });

  it("rechaza lugar vacío", () => {
    expect(() => validateMatch({ ...match, place: "" })).toThrow(/lugar/);
  });
});

describe("parseLineup", () => {
  it("lee los dos equipos y descarta campos de más", () => {
    const json = JSON.stringify({
      teamA: [{ playerId: "p1", nickname: "", goals: 99 }],
      teamB: [{ playerId: null, nickname: "Tano" }],
    });
    expect(parseLineup(json)).toEqual({
      teamA: [{ playerId: "p1", nickname: "" }],
      teamB: [{ playerId: null, nickname: "Tano" }],
    });
  });

  it("rechaza JSON roto o con forma incorrecta", () => {
    for (const json of ["{", "null", "[]", '{"teamA":[]}', '{"teamA":[{"playerId":1,"nickname":""}],"teamB":[]}']) {
      expect(() => parseLineup(json), json).toThrow(/formato/);
    }
  });
});

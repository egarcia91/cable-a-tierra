import { describe, expect, it } from "vitest";
import { matchInputSchema } from "./match";
import { firstError } from "./text";

const juancho = { type: "player", playerId: "juancho" } as const;
const beto = { type: "player", playerId: "beto" } as const;
const valid = { date: "2026-03-17", place: "Cancha 1", teamA: [juancho], teamB: [beto] };
const parse = (input: unknown) => matchInputSchema.safeParse(input);

describe("matchInputSchema", () => {
  it("acepta día, lugar y un jugador/a por equipo (AC-14)", () => {
    expect(parse(valid).success).toBe(true);
  });

  it("acepta un día futuro: el partido queda pendiente", () => {
    expect(parse({ ...valid, date: "2099-01-01" }).success).toBe(true);
  });

  it("rechaza un equipo sin jugadores/as (AC-54)", () => {
    expect(firstError(parse({ ...valid, teamB: [] }))).toBe("El equipo B tiene que tener al menos 1 jugador/a.");
  });

  it("rechaza al mismo jugador/a en los dos equipos (AC-62)", () => {
    expect(firstError(parse({ ...valid, teamB: [juancho] }))).toBe("Un jugador/a no puede estar dos veces en el partido.");
  });

  it("rechaza a un jugador/a repetido en el mismo equipo", () => {
    expect(firstError(parse({ ...valid, teamA: [juancho, juancho] }))).toBe(
      "Un jugador/a no puede estar dos veces en el partido.",
    );
  });

  it("acepta un externo/a indicando solo su apodo (AC-55)", () => {
    const result = parse({ ...valid, teamA: [juancho, { type: "external", nickname: " Tano " }] });
    expect(result.data?.teamA[1]).toEqual({ type: "external", nickname: "Tano" });
  });

  it("acepta dos externos/as con el mismo apodo: no son jugadores/as de la organización", () => {
    const tano = { type: "external", nickname: "Tano" };
    expect(parse({ ...valid, teamA: [tano], teamB: [tano] }).success).toBe(true);
  });

  it("rechaza un externo/a sin apodo o con un apodo de 41 caracteres (AC-71, AC-68)", () => {
    expect(firstError(parse({ ...valid, teamA: [{ type: "external", nickname: "  " }] }))).toBe(
      "El jugador/a tiene que tener un apodo.",
    );
    expect(firstError(parse({ ...valid, teamA: [{ type: "external", nickname: "a".repeat(41) }] }))).toBe(
      "El apodo puede tener hasta 40 caracteres.",
    );
  });

  it("rechaza un partido sin lugar (AC-81)", () => {
    expect(firstError(parse({ ...valid, place: "   " }))).toBe("El partido tiene que tener un lugar.");
  });

  it("acepta un lugar de 40 caracteres y rechaza uno de 41 (AC-82, AC-83)", () => {
    expect(parse({ ...valid, place: "a".repeat(40) }).success).toBe(true);
    expect(firstError(parse({ ...valid, place: "a".repeat(41) }))).toBe("El lugar puede tener hasta 40 caracteres.");
  });

  it("rechaza un día inválido", () => {
    expect(firstError(parse({ ...valid, date: "2026-02-30" }))).toBe("Elegí un día válido para el partido.");
    expect(firstError(parse({ ...valid, date: "" }))).toBe("Elegí un día válido para el partido.");
  });
});

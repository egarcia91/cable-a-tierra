import { describe, expect, it } from "vitest";
import { correctMatchInputSchema, finishMatchInputSchema, matchInputSchema } from "./match";
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

describe("finishMatchInputSchema", () => {
  const scored = (goals: unknown, ownGoals: unknown = 0) => ({ ...juancho, goals, ownGoals });
  const parseFinish = (entry: unknown) => finishMatchInputSchema.safeParse({ teamA: [entry], teamB: [{ ...beto, goals: 0, ownGoals: 0 }] });
  const GOALS_ERROR = "Los goles tienen que ser números enteros mayores o iguales a 0.";

  it("acepta 0 goles (AC-63)", () => {
    expect(parseFinish(scored(0)).success).toBe(true);
  });

  it("rechaza goles negativos (AC-64)", () => {
    expect(firstError(parseFinish(scored(-1)))).toBe(GOALS_ERROR);
  });

  it("rechaza goles no enteros (AC-65)", () => {
    expect(firstError(parseFinish(scored(1.5)))).toBe(GOALS_ERROR);
  });

  it("rechaza goles en contra inválidos o que no son números", () => {
    expect(firstError(parseFinish(scored(0, -1)))).toBe(GOALS_ERROR);
    expect(firstError(parseFinish(scored("2")))).toBe(GOALS_ERROR);
  });
});

describe("correctMatchInputSchema", () => {
  const scored = (entry: object, goals = 0) => ({ ...entry, goals, ownGoals: 0 });
  const corrected = { ...valid, teamA: [scored(juancho, 2)], teamB: [scored(beto, 1)] };
  const parseCorrection = (input: unknown) => correctMatchInputSchema.safeParse(input);

  it("acepta día, lugar, equipos y goles", () => {
    expect(parseCorrection(corrected).success).toBe(true);
  });

  it("aplica las validaciones del alta (RF-06k)", () => {
    expect(firstError(parseCorrection({ ...corrected, teamB: [] }))).toBe("El equipo B tiene que tener al menos 1 jugador/a.");
    expect(firstError(parseCorrection({ ...corrected, place: "  " }))).toBe("El partido tiene que tener un lugar.");
    expect(firstError(parseCorrection({ ...corrected, teamB: [scored(juancho)] }))).toBe(
      "Un jugador/a no puede estar dos veces en el partido.",
    );
  });

  it("rechaza goles inválidos (AC-51d)", () => {
    expect(firstError(parseCorrection({ ...corrected, teamA: [scored(juancho, -1)] }))).toBe(
      "Los goles tienen que ser números enteros mayores o iguales a 0.",
    );
  });

  it("exige los goles de cada uno", () => {
    expect(parseCorrection({ ...corrected, teamA: [juancho] }).success).toBe(false);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { firstError } from "./text";
import { playerInputSchema } from "./player";

const valid = { name: "Juan Pérez", nickname: "Juancho", birthDate: "1990-05-10" };
const parse = (input: unknown) => playerInputSchema.safeParse(input);

afterEach(() => {
  vi.useRealTimers();
});

describe("playerInputSchema", () => {
  it("acepta nombre, apodo y fecha de nacimiento (AC-04)", () => {
    expect(parse(valid).data).toEqual(valid);
  });

  it("acepta un jugador/a sin fecha de nacimiento y la guarda como null (AC-72)", () => {
    expect(parse({ name: "Juan Pérez", nickname: "Juancho" }).data?.birthDate).toBeNull();
    expect(parse({ ...valid, birthDate: "" }).data?.birthDate).toBeNull();
  });

  it("acepta un nombre de 40 caracteres y rechaza uno de 41 (AC-22a, AC-22b)", () => {
    expect(parse({ ...valid, name: "a".repeat(40) }).success).toBe(true);
    expect(firstError(parse({ ...valid, name: "a".repeat(41) }))).toBe("El nombre puede tener hasta 40 caracteres.");
  });

  it("acepta un apodo de 40 caracteres y rechaza uno de 41 (AC-45, AC-46)", () => {
    expect(parse({ ...valid, nickname: "a".repeat(40) }).success).toBe(true);
    expect(firstError(parse({ ...valid, nickname: "a".repeat(41) }))).toBe("El apodo puede tener hasta 40 caracteres.");
  });

  it("rechaza un jugador/a sin nombre o con nombre de solo espacios (AC-69, AC-90)", () => {
    expect(firstError(parse({ ...valid, name: "" }))).toBe("El jugador/a tiene que tener un nombre.");
    expect(firstError(parse({ ...valid, name: "   " }))).toBe("El jugador/a tiene que tener un nombre.");
  });

  it("rechaza un jugador/a sin apodo (AC-70)", () => {
    expect(firstError(parse({ ...valid, nickname: "  " }))).toBe("El jugador/a tiene que tener un apodo.");
  });

  it("acepta el 1/1/1920 y rechaza el 31/12/1919 (AC-47, AC-48)", () => {
    expect(parse({ ...valid, birthDate: "1920-01-01" }).success).toBe(true);
    expect(firstError(parse({ ...valid, birthDate: "1919-12-31" }))).toBe(
      "La fecha de nacimiento no puede ser anterior al 1/1/1920.",
    );
  });

  it("acepta hoy y rechaza mañana, en hora de Argentina (AC-73, AC-74)", () => {
    // 01:00 UTC del 11/03 son las 22:00 del 10/03 en Argentina: "hoy" es el 10.
    vi.useFakeTimers({ now: new Date("2026-03-11T01:00:00Z"), toFake: ["Date"] });

    expect(parse({ ...valid, birthDate: "2026-03-10" }).success).toBe(true);
    expect(firstError(parse({ ...valid, birthDate: "2026-03-11" }))).toBe(
      "La fecha de nacimiento no puede ser posterior a hoy.",
    );
  });

  it("rechaza fechas que no existen o con otro formato", () => {
    expect(firstError(parse({ ...valid, birthDate: "1990-02-30" }))).toBe("La fecha de nacimiento no es válida.");
    expect(firstError(parse({ ...valid, birthDate: "10/05/1990" }))).toBe("La fecha de nacimiento no es válida.");
  });
});

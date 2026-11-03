import { describe, expect, it } from "vitest";
import { firstError } from "./text";
import { organizationInputSchema } from "./organization";

const parse = (input: unknown) => organizationInputSchema.safeParse(input);

describe("organizationInputSchema", () => {
  it("acepta un nombre de 40 caracteres (AC-76)", () => {
    expect(parse({ name: "a".repeat(40) }).success).toBe(true);
  });

  it("rechaza un nombre de 41 caracteres (AC-77)", () => {
    expect(firstError(parse({ name: "a".repeat(41) }))).toBe("El nombre puede tener hasta 40 caracteres.");
  });

  it("rechaza una organización sin nombre (AC-75)", () => {
    expect(firstError(parse({ name: "" }))).toBe("La organización tiene que tener un nombre.");
    expect(firstError(parse({}))).toBe("La organización tiene que tener un nombre.");
  });

  it("considera vacío un nombre de solo espacios (RF-19l)", () => {
    expect(firstError(parse({ name: "   " }))).toBe("La organización tiene que tener un nombre.");
  });

  it("recorta los espacios del nombre", () => {
    expect(parse({ name: "  Los Martes  " }).data?.name).toBe("Los Martes");
  });

  it("cuenta los emojis como un caracter", () => {
    expect(parse({ name: "⚽".repeat(40) }).success).toBe(true);
  });

  it("acepta una organización sin descripción y la guarda como null (AC-78)", () => {
    expect(parse({ name: "Los Martes" }).data?.description).toBeNull();
    expect(parse({ name: "Los Martes", description: "   " }).data?.description).toBeNull();
  });

  it("acepta una descripción de 200 caracteres (AC-79)", () => {
    expect(parse({ name: "Los Martes", description: "a".repeat(200) }).success).toBe(true);
  });

  it("rechaza una descripción de 201 caracteres (AC-80)", () => {
    expect(firstError(parse({ name: "Los Martes", description: "a".repeat(201) }))).toBe(
      "La descripción puede tener hasta 200 caracteres.",
    );
  });
});

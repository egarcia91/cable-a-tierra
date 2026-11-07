import { describe, expect, it } from "vitest";
import { accountLinkInputSchema } from "./account-link";
import { firstError } from "./text";

describe("accountLinkInputSchema", () => {
  it("normaliza el email a minúsculas y sin espacios", () => {
    expect(accountLinkInputSchema.parse({ email: "  Pepe@Gmail.com " }).email).toBe("pepe@gmail.com");
  });

  it("rechaza un email vacío o inválido", () => {
    expect(firstError(accountLinkInputSchema.safeParse({ email: " " }))).toBe("Ingresá el email de Google de la cuenta.");
    expect(firstError(accountLinkInputSchema.safeParse({ email: "pepe" }))).toBe("El email no es válido.");
  });
});

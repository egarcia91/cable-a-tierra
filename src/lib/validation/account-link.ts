import { z } from "zod";

// El email de Google de la cuenta a asociar (RF-07b). Se compara en minúsculas,
// igual que se guarda al registrar al usuario.
export const accountLinkInputSchema = z.object({
  email: z
    .string("Ingresá el email de Google de la cuenta.")
    .trim()
    .toLowerCase()
    .min(1, "Ingresá el email de Google de la cuenta.")
    .pipe(z.email("El email no es válido.")),
});

export type AccountLinkInput = z.input<typeof accountLinkInputSchema>;

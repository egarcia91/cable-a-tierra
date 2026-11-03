import { z } from "zod";
import { optionalText, requiredText } from "./text";

export const ORGANIZATION_NAME_MAX = 40;
export const ORGANIZATION_DESCRIPTION_MAX = 200;

// RF-19g, RF-19h, RF-19i, RF-19l.
export const organizationInputSchema = z.object({
  name: requiredText(ORGANIZATION_NAME_MAX, {
    empty: "La organización tiene que tener un nombre.",
    tooLong: `El nombre puede tener hasta ${ORGANIZATION_NAME_MAX} caracteres.`,
  }),
  description: optionalText(
    ORGANIZATION_DESCRIPTION_MAX,
    `La descripción puede tener hasta ${ORGANIZATION_DESCRIPTION_MAX} caracteres.`,
  ),
});

export type OrganizationInput = z.input<typeof organizationInputSchema>;
export type ValidOrganization = z.output<typeof organizationInputSchema>;

import { z } from "zod";
import { isRealDate } from "./dates";
import { nicknameSchema } from "./player";
import { requiredText } from "./text";

export const MATCH_PLACE_MAX = 40;

// Cada lugar de un equipo es un jugador/a de la organización o un externo/a,
// del que solo se indica el apodo (RF-08e, RF-20a).
export const teamEntrySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("player"), playerId: z.string().min(1) }),
  z.object({ type: z.literal("external"), nickname: nicknameSchema }),
]);

const teamSchema = (label: string) =>
  z.array(teamEntrySchema).min(1, `El ${label} tiene que tener al menos 1 jugador/a.`);

export const matchInputSchema = z
  .object({
    date: z.string().refine(isRealDate, "Elegí un día válido para el partido."),
    // RF-19j, RF-19k, RF-19l.
    place: requiredText(MATCH_PLACE_MAX, {
      empty: "El partido tiene que tener un lugar.",
      tooLong: `El lugar puede tener hasta ${MATCH_PLACE_MAX} caracteres.`,
    }),
    // RF-08a, RF-08d.
    teamA: teamSchema("equipo A"),
    teamB: teamSchema("equipo B"),
  })
  .superRefine((match, ctx) => {
    // Un jugador/a no puede estar dos veces: ni en los dos equipos (RF-08f) ni repetido en uno.
    const ids = [...match.teamA, ...match.teamB].flatMap((e) => (e.type === "player" ? [e.playerId] : []));
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: "custom", message: "Un jugador/a no puede estar dos veces en el partido." });
    }
  });

export type TeamEntry = z.output<typeof teamEntrySchema>;
export type MatchInput = z.input<typeof matchInputSchema>;
export type ValidMatch = z.output<typeof matchInputSchema>;

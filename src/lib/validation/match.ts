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

// Goles y goles en contra de cada lugar, al finalizar o corregir un partido (RF-08b, RF-08c).
const GOALS_ERROR = "Los goles tienen que ser números enteros mayores o iguales a 0.";
const goalsSchema = z.number(GOALS_ERROR).int(GOALS_ERROR).min(0, GOALS_ERROR);
const scored = { goals: goalsSchema, ownGoals: goalsSchema };

export const scoredTeamEntrySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("player"), playerId: z.string().min(1), ...scored }),
  z.object({ type: z.literal("external"), nickname: nicknameSchema, ...scored }),
]);

/**
 * Día, lugar y equipos. Lo comparten el alta y la edición de pendientes (con
 * `teamEntrySchema`) y la corrección de finalizados (con `scoredTeamEntrySchema`),
 * así la corrección aplica las mismas validaciones (RF-06k).
 */
function matchSchema<Entry extends typeof teamEntrySchema | typeof scoredTeamEntrySchema>(entry: Entry) {
  const team = (label: string) => z.array(entry).min(1, `El ${label} tiene que tener al menos 1 jugador/a.`);
  return z
    .object({
      date: z.string().refine(isRealDate, "Elegí un día válido para el partido."),
      // RF-19j, RF-19k, RF-19l.
      place: requiredText(MATCH_PLACE_MAX, {
        empty: "El partido tiene que tener un lugar.",
        tooLong: `El lugar puede tener hasta ${MATCH_PLACE_MAX} caracteres.`,
      }),
      // RF-08a, RF-08d.
      teamA: team("equipo A"),
      teamB: team("equipo B"),
    })
    .superRefine((match, ctx) => {
      // Un jugador/a no puede estar dos veces: ni en los dos equipos (RF-08f) ni repetido en uno.
      const ids = [...match.teamA, ...match.teamB].flatMap((e) => (e.type === "player" ? [e.playerId] : []));
      if (new Set(ids).size !== ids.length) {
        ctx.addIssue({ code: "custom", message: "Un jugador/a no puede estar dos veces en el partido." });
      }
    });
}

export const matchInputSchema = matchSchema(teamEntrySchema);

/** Corrección de un partido finalizado: día, lugar, equipos y goles (RF-06g, RF-06h, RF-06i). */
export const correctMatchInputSchema = matchSchema(scoredTeamEntrySchema);

/**
 * Al finalizar se mandan los mismos equipos del partido con los goles de cada uno.
 * El servidor verifica que coincidan con los guardados.
 */
export const finishMatchInputSchema = z.object({
  teamA: z.array(scoredTeamEntrySchema),
  teamB: z.array(scoredTeamEntrySchema),
});

export type TeamEntry = z.output<typeof teamEntrySchema>;
export type ScoredTeamEntry = z.output<typeof scoredTeamEntrySchema>;
export type FinishMatchInput = z.input<typeof finishMatchInputSchema>;
export type ValidFinishMatch = z.output<typeof finishMatchInputSchema>;
export type MatchInput = z.input<typeof matchInputSchema>;
export type ValidMatch = z.output<typeof matchInputSchema>;
export type CorrectMatchInput = z.input<typeof correctMatchInputSchema>;
export type ValidCorrectMatch = z.output<typeof correctMatchInputSchema>;

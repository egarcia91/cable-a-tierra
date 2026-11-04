"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { computeScore } from "@/lib/match-stats";
import type { Player, TeamEntry } from "@/lib/types";
import type { FinishMatchInput } from "@/lib/validation/match";
import { entryName } from "./TeamList";
import { GoalInputs, NO_GOALS, parseGoals, type GoalsDraft } from "./GoalInputs";

type Props = {
  teamA: TeamEntry[];
  teamB: TeamEntry[];
  playersById: Map<string, Player>;
  onSubmit: (input: FinishMatchInput) => Promise<ActionResult<unknown>>;
};

/** Carga de goles con los equipos ya armados; el marcador se ve a medida que se carga. */
export function FinishMatchForm({ teamA, teamB, playersById, onSubmit }: Props) {
  const [goals, setGoals] = useState<{ A: GoalsDraft[]; B: GoalsDraft[] }>({
    A: teamA.map(() => NO_GOALS),
    B: teamB.map(() => NO_GOALS),
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const input: FinishMatchInput = {
    teamA: teamA.map((entry, i) => ({ ...entry, ...parseGoals(goals.A[i]) })),
    teamB: teamB.map((entry, i) => ({ ...entry, ...parseGoals(goals.B[i]) })),
  };
  const score = computeScore(input);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await onSubmit(input);
    setPending(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      {(["A", "B"] as const).map((side) => (
        <fieldset key={side} className="lineup">
          <legend>Equipo {side}</legend>
          {(side === "A" ? teamA : teamB).map((entry, i) => (
            <GoalInputs
              key={i}
              name={entryName(entry, playersById)}
              value={goals[side][i]}
              onChange={(value) =>
                setGoals((current) => ({ ...current, [side]: current[side].map((g, j) => (j === i ? value : g)) }))
              }
            />
          ))}
        </fieldset>
      ))}
      <p className="score" aria-label="Marcador">
        Equipo A {score.a} – {score.b} Equipo B
      </p>
      <button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Finalizar partido"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

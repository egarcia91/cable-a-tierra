"use client";

import { useActionState, useState } from "react";
import { finishMatchAction } from "@/app/actions/matches";
import type { MatchPlayer } from "@/lib/matches";

type Team = "A" | "B";

interface Props {
  orgId: string;
  matchId: string;
  teamA: MatchPlayer[];
  teamB: MatchPlayer[];
}

const toCount = (value: string) => Math.max(0, Math.floor(Number(value) || 0));

export function FinishMatchForm({ orgId, matchId, teamA, teamB }: Props) {
  const [state, action, pending] = useActionState(finishMatchAction.bind(null, orgId, matchId), {});
  const [goals, setGoals] = useState<Record<Team, number[]>>({
    A: teamA.map(() => 0),
    B: teamB.map(() => 0),
  });
  const [ownGoals, setOwnGoals] = useState<Record<Team, number>>({ A: 0, B: 0 });

  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  // Mismo cálculo que el servidor: los goles en contra de un equipo suman al rival.
  const scoreA = sum(goals.A) + ownGoals.B;
  const scoreB = sum(goals.B) + ownGoals.A;

  const setPlayerGoals = (t: Team, i: number, value: string) =>
    setGoals({ ...goals, [t]: goals[t].map((g, j) => (j === i ? toCount(value) : g)) });

  return (
    <form action={action}>
      {(["A", "B"] as const).map((t) => (
        <fieldset key={t}>
          <legend>Equipo {t}</legend>
          {(t === "A" ? teamA : teamB).map((p, i) => (
            <label key={`${p.playerId ?? "ext"}-${i}`}>
              {p.nickname}
              {p.external && " (externo/a)"}
              <input
                type="number"
                name={`goals${t}-${i}`}
                min={0}
                step={1}
                value={goals[t][i]}
                onChange={(e) => setPlayerGoals(t, i, e.target.value)}
              />
            </label>
          ))}
          <label>
            Goles en contra del equipo {t} (suman al rival)
            <input
              type="number"
              name={`ownGoals${t}`}
              min={0}
              step={1}
              value={ownGoals[t]}
              onChange={(e) => setOwnGoals({ ...ownGoals, [t]: toCount(e.target.value) })}
            />
          </label>
        </fieldset>
      ))}

      {/* Visibilidad clara del resultado antes de confirmar (mitigación del PRD). */}
      <p aria-live="polite">
        <strong>
          Resultado: Equipo A {scoreA} – {scoreB} Equipo B
        </strong>
      </p>
      <p>Una vez finalizado, el partido no se puede editar.</p>

      <button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Finalizar partido"}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}

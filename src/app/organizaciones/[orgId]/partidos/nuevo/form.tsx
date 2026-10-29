"use client";

import { useActionState, useState } from "react";
import { createMatchAction } from "@/app/actions/matches";
import { MAX_TEXT_LENGTH } from "@/lib/domain/validation";

type Team = "A" | "B";

interface Props {
  orgId: string;
  players: { id: string; nickname: string }[];
}

// Fecha local de hoy en YYYY-MM-DD (toISOString usa UTC y de noche daría mañana).
const today = () => new Date().toLocaleDateString("sv-SE");

export function NewMatchForm({ orgId, players }: Props) {
  const [state, action, pending] = useActionState(createMatchAction.bind(null, orgId), {});
  const [assigned, setAssigned] = useState<Record<string, Team | undefined>>({});
  const [externals, setExternals] = useState<{ team: Team; nickname: string }[]>([]);
  const [externalName, setExternalName] = useState<Record<Team, string>>({ A: "", B: "" });

  const team = (t: Team) => [
    ...players.filter((p) => assigned[p.id] === t).map((p) => ({ playerId: p.id, nickname: p.nickname })),
    ...externals.filter((e) => e.team === t).map((e) => ({ playerId: null, nickname: e.nickname })),
  ];
  const lineup = JSON.stringify({ teamA: team("A"), teamB: team("B") });

  const addExternal = (t: Team) => {
    const nickname = externalName[t].trim();
    if (!nickname) return;
    setExternals([...externals, { team: t, nickname }]);
    setExternalName({ ...externalName, [t]: "" });
  };

  return (
    <form action={action}>
      <label>
        Día
        <input name="date" type="date" required defaultValue={today()} />
      </label>
      <label>
        Lugar
        <input name="place" required maxLength={80} />
      </label>

      <fieldset>
        <legend>Jugadores/as</legend>
        {players.length === 0 && <p>La organización todavía no tiene jugadores/as.</p>}
        {players.map((p) => (
          <div key={p.id} role="radiogroup" aria-label={p.nickname}>
            <span>{p.nickname}</span>
            {([undefined, "A", "B"] as const).map((t) => (
              <label key={t ?? "none"}>
                <input
                  type="radio"
                  name={`player-${p.id}`}
                  checked={assigned[p.id] === t}
                  onChange={() => setAssigned({ ...assigned, [p.id]: t })}
                />
                {t ? `Equipo ${t}` : "No juega"}
              </label>
            ))}
          </div>
        ))}
      </fieldset>

      {(["A", "B"] as const).map((t) => (
        <fieldset key={t}>
          <legend>Equipo {t}</legend>
          <ul>
            {team(t).map((p, i) => (
              <li key={`${p.playerId ?? "ext"}-${i}`}>
                {p.nickname}
                {p.playerId === null && " (externo/a)"}
              </li>
            ))}
          </ul>
          <label>
            Agregar externo/a (apodo)
            <input
              value={externalName[t]}
              maxLength={MAX_TEXT_LENGTH}
              onChange={(e) => setExternalName({ ...externalName, [t]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addExternal(t);
                }
              }}
            />
          </label>
          <button type="button" onClick={() => addExternal(t)}>
            Agregar al equipo {t}
          </button>
        </fieldset>
      ))}

      <input type="hidden" name="lineup" value={lineup} />
      <button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Dar de alta el partido"}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}

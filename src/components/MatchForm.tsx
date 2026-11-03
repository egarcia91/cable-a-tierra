"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { todayInArgentina } from "@/lib/dates";
import type { Player, TeamEntry } from "@/lib/types";
import { MATCH_PLACE_MAX, type MatchInput } from "@/lib/validation/match";
import { PLAYER_NICKNAME_MAX } from "@/lib/validation/player";

type Side = "A" | "B";

type Props = {
  players: Player[];
  initial?: { date: string; place: string; teamA: TeamEntry[]; teamB: TeamEntry[] };
  submitLabel: string;
  onSubmit: (input: MatchInput) => Promise<ActionResult<unknown>>;
};

function initialSides(teamA: TeamEntry[], teamB: TeamEntry[]): Record<string, Side> {
  const sides: Record<string, Side> = {};
  for (const e of teamA) if (e.type === "player") sides[e.playerId] = "A";
  for (const e of teamB) if (e.type === "player") sides[e.playerId] = "B";
  return sides;
}

const externalsOf = (team: TeamEntry[]) => team.flatMap((e) => (e.type === "external" ? [e.nickname] : []));

// Cada jugador/a tiene un solo selector de equipo, así no puede quedar en los dos (RF-08f).
// La validación la hace el servidor.
export function MatchForm({ players, initial, submitLabel, onSubmit }: Props) {
  const [date, setDate] = useState(initial?.date ?? todayInArgentina());
  const [place, setPlace] = useState(initial?.place ?? "");
  const [sides, setSides] = useState(() => initialSides(initial?.teamA ?? [], initial?.teamB ?? []));
  const [externals, setExternals] = useState<Record<Side, string[]>>({
    A: externalsOf(initial?.teamA ?? []),
    B: externalsOf(initial?.teamB ?? []),
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function setSide(playerId: string, side: Side | "") {
    setSides(({ [playerId]: _, ...rest }) => (side ? { ...rest, [playerId]: side } : rest));
  }

  function team(side: Side): TeamEntry[] {
    return [
      ...players.filter((p) => sides[p.id] === side).map((p) => ({ type: "player" as const, playerId: p.id })),
      ...externals[side].map((nickname) => ({ type: "external" as const, nickname })),
    ];
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await onSubmit({ date, place, teamA: team("A"), teamB: team("B") });
    setPending(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>
        Día
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label>
        Lugar
        <input value={place} onChange={(e) => setPlace(e.target.value)} maxLength={MATCH_PLACE_MAX} required />
      </label>

      <fieldset className="lineup">
        <legend>Jugadores/as de la organización</legend>
        {players.length === 0 && <p>Todavía no hay jugadores/as. Podés sumar externos/as abajo.</p>}
        {players.map((player) => (
          <label key={player.id} className="lineup-row">
            {player.nickname}
            <select value={sides[player.id] ?? ""} onChange={(e) => setSide(player.id, e.target.value as Side | "")}>
              <option value="">No juega</option>
              <option value="A">Equipo A</option>
              <option value="B">Equipo B</option>
            </select>
          </label>
        ))}
      </fieldset>

      {(["A", "B"] as const).map((side) => (
        <ExternalsEditor
          key={side}
          side={side}
          nicknames={externals[side]}
          onChange={(nicknames) => setExternals((current) => ({ ...current, [side]: nicknames }))}
        />
      ))}

      <p>
        Equipo A: {team("A").length} · Equipo B: {team("B").length}
      </p>
      <button type="submit" disabled={pending}>
        {pending ? "Guardando…" : submitLabel}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

/** Externos/as de un equipo: solo se indica el apodo (RF-08e). */
function ExternalsEditor({
  side,
  nicknames,
  onChange,
}: {
  side: Side;
  nicknames: string[];
  onChange: (nicknames: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    // Se agrega tal cual: si es inválido (vacío, muy largo) lo rechaza el servidor.
    onChange([...nicknames, draft]);
    setDraft("");
  }

  return (
    <fieldset className="lineup">
      <legend>Externos/as del equipo {side}</legend>
      {nicknames.map((nickname, i) => (
        <div key={i} className="lineup-row">
          <span>{nickname} (externo/a)</span>
          <button
            type="button"
            className="button-secondary"
            aria-label={`Quitar a ${nickname} del equipo ${side}`}
            onClick={() => onChange(nicknames.filter((_, j) => j !== i))}
          >
            Quitar
          </button>
        </div>
      ))}
      <div className="lineup-row">
        <input
          aria-label={`Apodo del externo/a para el equipo ${side}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={PLAYER_NICKNAME_MAX}
          placeholder="Apodo"
        />
        <button type="button" className="button-secondary" onClick={add} disabled={draft === ""}>
          Agregar al equipo {side}
        </button>
      </div>
    </fieldset>
  );
}

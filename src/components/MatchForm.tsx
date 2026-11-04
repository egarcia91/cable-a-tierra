"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { todayInArgentina } from "@/lib/dates";
import { computeScore } from "@/lib/match-stats";
import type { Player, ScoredTeamEntry, TeamEntry } from "@/lib/types";
import { MATCH_PLACE_MAX, type CorrectMatchInput } from "@/lib/validation/match";
import { PLAYER_NICKNAME_MAX } from "@/lib/validation/player";
import { GoalInputs, NO_GOALS, parseGoals, type GoalsDraft } from "./GoalInputs";

type Side = "A" | "B";

type Entry = TeamEntry | ScoredTeamEntry;
type External = { nickname: string; goals: GoalsDraft };

type Props = {
  players: Player[];
  initial?: { date: string; place: string; teamA: Entry[]; teamB: Entry[] };
  /** Al corregir un partido finalizado también se cargan los goles (RF-06g). */
  withGoals?: boolean;
  submitLabel: string;
  /**
   * Los lugares siempre llevan goles (en 0 si no se cargan): para un partido
   * pendiente el servidor los descarta.
   */
  onSubmit: (input: CorrectMatchInput) => Promise<ActionResult<unknown>>;
};

const draftOf = (entry: Entry): GoalsDraft =>
  "goals" in entry ? { goals: String(entry.goals), ownGoals: String(entry.ownGoals) } : NO_GOALS;

function initialSides(teamA: Entry[], teamB: Entry[]): Record<string, Side> {
  const sides: Record<string, Side> = {};
  for (const e of teamA) if (e.type === "player") sides[e.playerId] = "A";
  for (const e of teamB) if (e.type === "player") sides[e.playerId] = "B";
  return sides;
}

function initialPlayerGoals(team: Entry[]): Record<string, GoalsDraft> {
  return Object.fromEntries(team.flatMap((e) => (e.type === "player" ? [[e.playerId, draftOf(e)]] : [])));
}

const externalsOf = (team: Entry[]): External[] =>
  team.flatMap((e) => (e.type === "external" ? [{ nickname: e.nickname, goals: draftOf(e) }] : []));

// Cada jugador/a tiene un solo selector de equipo, así no puede quedar en los dos (RF-08f).
// La validación la hace el servidor.
export function MatchForm({ players, initial, withGoals = false, submitLabel, onSubmit }: Props) {
  const [date, setDate] = useState(initial?.date ?? todayInArgentina());
  const [place, setPlace] = useState(initial?.place ?? "");
  const [sides, setSides] = useState(() => initialSides(initial?.teamA ?? [], initial?.teamB ?? []));
  const [playerGoals, setPlayerGoals] = useState(() => ({
    ...initialPlayerGoals(initial?.teamA ?? []),
    ...initialPlayerGoals(initial?.teamB ?? []),
  }));
  const [externals, setExternals] = useState<Record<Side, External[]>>({
    A: externalsOf(initial?.teamA ?? []),
    B: externalsOf(initial?.teamB ?? []),
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function setSide(playerId: string, side: Side | "") {
    setSides(({ [playerId]: _, ...rest }) => (side ? { ...rest, [playerId]: side } : rest));
  }

  function team(side: Side): ScoredTeamEntry[] {
    return [
      ...players
        .filter((p) => sides[p.id] === side)
        .map((p) => ({ type: "player" as const, playerId: p.id, ...parseGoals(playerGoals[p.id] ?? NO_GOALS) })),
      ...externals[side].map((e) => ({ type: "external" as const, nickname: e.nickname, ...parseGoals(e.goals) })),
    ];
  }

  function setExternalGoals(side: Side, index: number, goals: GoalsDraft) {
    setExternals((current) => ({
      ...current,
      [side]: current[side].map((e, i) => (i === index ? { ...e, goals } : e)),
    }));
  }

  const score = computeScore({ teamA: team("A"), teamB: team("B") });

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
          externals={externals[side]}
          onChange={(list) => setExternals((current) => ({ ...current, [side]: list }))}
        />
      ))}

      {withGoals &&
        (["A", "B"] as const).map((side) => (
          <fieldset key={side} className="lineup">
            <legend>Goles del equipo {side}</legend>
            {players
              .filter((p) => sides[p.id] === side)
              .map((p) => (
                <GoalInputs
                  key={p.id}
                  name={p.nickname}
                  value={playerGoals[p.id] ?? NO_GOALS}
                  onChange={(goals) => setPlayerGoals((current) => ({ ...current, [p.id]: goals }))}
                />
              ))}
            {externals[side].map((e, i) => (
              <GoalInputs
                key={`external-${i}`}
                name={`${e.nickname} (externo/a)`}
                value={e.goals}
                onChange={(goals) => setExternalGoals(side, i, goals)}
              />
            ))}
          </fieldset>
        ))}

      <p>
        Equipo A: {team("A").length} · Equipo B: {team("B").length}
      </p>
      {withGoals && (
        <p className="score" aria-label="Marcador">
          Equipo A {score.a} – {score.b} Equipo B
        </p>
      )}
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
  externals,
  onChange,
}: {
  side: Side;
  externals: External[];
  onChange: (externals: External[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    // Se agrega tal cual: si es inválido (vacío, muy largo) lo rechaza el servidor.
    onChange([...externals, { nickname: draft, goals: NO_GOALS }]);
    setDraft("");
  }

  return (
    <fieldset className="lineup">
      <legend>Externos/as del equipo {side}</legend>
      {externals.map(({ nickname }, i) => (
        <div key={i} className="lineup-row">
          <span>{nickname} (externo/a)</span>
          <button
            type="button"
            className="button-secondary"
            aria-label={`Quitar a ${nickname} del equipo ${side}`}
            onClick={() => onChange(externals.filter((_, j) => j !== i))}
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

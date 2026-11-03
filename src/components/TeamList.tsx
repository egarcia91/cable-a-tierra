import type { Player, TeamEntry } from "@/lib/types";

/** Un equipo: los externos/as se marcan como "externo/a" (RF-20a). */
export function TeamList({ title, team, playersById }: { title: string; team: TeamEntry[]; playersById: Map<string, Player> }) {
  return (
    <section>
      <h3>{title}</h3>
      <ul className="team">
        {team.map((entry, i) =>
          entry.type === "player" ? (
            <li key={entry.playerId}>{playersById.get(entry.playerId)?.nickname ?? "…"}</li>
          ) : (
            <li key={`external-${i}`}>
              {entry.nickname} <small>(externo/a)</small>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}

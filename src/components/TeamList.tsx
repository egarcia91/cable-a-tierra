import type { Player, ScoredTeamEntry, TeamEntry } from "@/lib/types";

/** Cómo se nombra un lugar del equipo: los externos/as se marcan como "externo/a" (RF-20a). */
export const entryName = (entry: TeamEntry, playersById: Map<string, Player>) =>
  entry.type === "player" ? (playersById.get(entry.playerId)?.nickname ?? "…") : `${entry.nickname} (externo/a)`;

function goalsLabel(entry: TeamEntry | ScoredTeamEntry): string {
  if (!("goals" in entry)) return "";
  const parts = [
    entry.goals > 0 && (entry.goals === 1 ? "1 gol" : `${entry.goals} goles`),
    entry.ownGoals > 0 && `${entry.ownGoals} en contra`,
  ].filter(Boolean);
  return parts.length > 0 ? ` · ${parts.join(", ")}` : "";
}

/** Un equipo; si el partido está finalizado, con los goles de cada uno. */
export function TeamList({
  title,
  team,
  playersById,
}: {
  title: string;
  team: TeamEntry[] | ScoredTeamEntry[];
  playersById: Map<string, Player>;
}) {
  return (
    <section>
      <h3>{title}</h3>
      <ul className="team">
        {team.map((entry, i) => (
          <li key={entry.type === "player" ? entry.playerId : `external-${i}`}>
            {entryName(entry, playersById)}
            {goalsLabel(entry)}
          </li>
        ))}
      </ul>
    </section>
  );
}

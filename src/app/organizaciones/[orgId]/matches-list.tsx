import Link from "next/link";
import { formatDate } from "@/lib/format";
import type { Match, MatchPlayer } from "@/lib/matches";

function TeamPlayers({ players }: { players: MatchPlayer[] }) {
  return (
    <ul>
      {players.map((p, i) => (
        <li key={`${p.playerId ?? "ext"}-${i}`}>
          {p.nickname}
          {p.external && " (externo/a)"}
          {!!p.goals && ` · ${p.goals} ${p.goals === 1 ? "gol" : "goles"}`}
        </li>
      ))}
    </ul>
  );
}

interface Props {
  orgId: string;
  matches: Match[];
  canFinish: boolean; // solo el admin finaliza partidos
}

export function MatchesList({ orgId, matches, canFinish }: Props) {
  if (matches.length === 0) return <p>Todavía no hay partidos.</p>;

  return (
    <ol>
      {matches.map((m) => (
        <li key={m.id}>
          <article>
            <header>
              <strong>{formatDate(m.date)}</strong> · {m.place} ·{" "}
              {m.status === "finished" ? (
                <span>
                  Finalizado: {m.scoreA} a {m.scoreB}
                </span>
              ) : (
                <>
                  <span>Pendiente</span>
                  {canFinish && (
                    <>
                      {" · "}
                      <Link href={`/organizaciones/${orgId}/partidos/${m.id}/finalizar`}>Finalizar</Link>
                    </>
                  )}
                </>
              )}
            </header>
            <div>
              <h4>Equipo A</h4>
              <TeamPlayers players={m.teamA} />
            </div>
            <div>
              <h4>Equipo B</h4>
              <TeamPlayers players={m.teamB} />
            </div>
          </article>
        </li>
      ))}
    </ol>
  );
}

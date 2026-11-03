"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { TeamList } from "@/components/TeamList";
import { useMatch } from "@/hooks/useMatch";
import { useOrganization } from "@/hooks/useOrganization";
import { usePlayers } from "@/hooks/usePlayers";
import { formatDate } from "@/lib/format";

export default function MatchPage() {
  const { id, matchId } = useParams<{ id: string; matchId: string }>();
  const organization = useOrganization(id);
  const players = usePlayers(id);
  const match = useMatch(id, matchId);
  const { user } = useAuth();

  const playersById = useMemo(
    () => new Map(players.status === "ready" ? players.players.map((p) => [p.id, p]) : []),
    [players],
  );

  if (match.status === "loading" || organization.status === "loading") return <main><p>Cargando…</p></main>;
  if (match.status === "not-found") return <main><p>El partido no existe.</p></main>;
  if (match.status === "error" || organization.status !== "ready") {
    return <main><p role="alert">No pudimos cargar el partido.</p></main>;
  }

  const { match: m } = match;
  const isAdmin = user?.uid === organization.organization.adminUid;

  return (
    <main>
      <p>
        <Link href={`/organizaciones/${id}`}>{organization.organization.name}</Link>
      </p>
      <h1>
        Partido del {formatDate(m.date)}
      </h1>
      <p>
        {m.place} · {m.status === "pending" ? "Pendiente" : "Finalizado"}
      </p>
      {isAdmin && m.status === "pending" && (
        <p>
          <Link href={`/organizaciones/${id}/partidos/${matchId}/editar`}>Editar partido</Link>
        </p>
      )}
      <div className="teams">
        <TeamList title="Equipo A" team={m.teamA} playersById={playersById} />
        <TeamList title="Equipo B" team={m.teamB} playersById={playersById} />
      </div>
    </main>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { finishMatchAction } from "@/app/actions/matches";
import { useAuth } from "@/components/AuthProvider";
import { FinishMatchForm } from "@/components/FinishMatchForm";
import { useMatch } from "@/hooks/useMatch";
import { useOrganization } from "@/hooks/useOrganization";
import { usePlayers } from "@/hooks/usePlayers";
import { todayInArgentina } from "@/lib/dates";
import { formatDate } from "@/lib/format";

export default function FinishMatchPage() {
  const { id, matchId } = useParams<{ id: string; matchId: string }>();
  const organization = useOrganization(id);
  const players = usePlayers(id);
  const match = useMatch(id, matchId);
  const { user, loading } = useAuth();
  const router = useRouter();

  const playersById = useMemo(
    () => new Map(players.status === "ready" ? players.players.map((p) => [p.id, p]) : []),
    [players],
  );

  if (loading || [organization.status, players.status, match.status].includes("loading")) {
    return <main><p>Cargando…</p></main>;
  }
  if (match.status === "not-found") return <main><p>El partido no existe.</p></main>;
  if (organization.status !== "ready" || players.status !== "ready" || match.status !== "ready") {
    return <main><p role="alert">No pudimos cargar el partido.</p></main>;
  }
  // Solo para no mostrar un formulario inútil: el permiso y las reglas los valida el servidor.
  if (user?.uid !== organization.organization.adminUid) {
    return <main><p>Solo el administrador/a puede finalizar partidos.</p></main>;
  }
  const m = match.match;
  if (m.status !== "pending") return <main><p>El partido ya está finalizado.</p></main>;
  if (m.date > todayInArgentina()) {
    return <main><p>El partido se puede finalizar desde el {formatDate(m.date)}.</p></main>;
  }

  return (
    <main>
      <h1>Finalizar el partido del {formatDate(m.date)}</h1>
      <p>Cargá los goles de cada uno. Los goles en contra suman para el equipo rival.</p>
      <FinishMatchForm
        // Si el partido cambia mientras se carga, el formulario arranca de nuevo.
        key={JSON.stringify([m.teamA, m.teamB])}
        teamA={m.teamA}
        teamB={m.teamB}
        playersById={playersById}
        onSubmit={async (input) => {
          const result = await finishMatchAction(await user.getIdToken(), id, matchId, input);
          if (result.ok) router.push(`/organizaciones/${id}/partidos/${matchId}`);
          return result;
        }}
      />
    </main>
  );
}

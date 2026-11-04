"use client";

import { useParams, useRouter } from "next/navigation";
import { correctMatchAction } from "@/app/actions/matches";
import { useAuth } from "@/components/AuthProvider";
import { MatchForm } from "@/components/MatchForm";
import { useMatch } from "@/hooks/useMatch";
import { useOrganization } from "@/hooks/useOrganization";
import { usePlayers } from "@/hooks/usePlayers";

export default function CorrectMatchPage() {
  const { id, matchId } = useParams<{ id: string; matchId: string }>();
  const organization = useOrganization(id);
  const players = usePlayers(id);
  const match = useMatch(id, matchId);
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading || [organization.status, players.status, match.status].includes("loading")) {
    return <main><p>Cargando…</p></main>;
  }
  if (match.status === "not-found") return <main><p>El partido no existe.</p></main>;
  if (organization.status !== "ready" || players.status !== "ready" || match.status !== "ready") {
    return <main><p role="alert">No pudimos cargar el partido.</p></main>;
  }
  // Solo para no mostrar un formulario inútil: el permiso real lo valida el servidor.
  if (user?.uid !== organization.organization.adminUid) {
    return <main><p>Solo el administrador/a puede corregir partidos.</p></main>;
  }
  if (match.match.status !== "finished") {
    return <main><p>El partido todavía no está finalizado.</p></main>;
  }

  return (
    <main>
      <h1>Corregir partido</h1>
      <p>Al guardar se recalculan las estadísticas de los jugadores/as.</p>
      <MatchForm
        players={players.players}
        initial={match.match}
        withGoals
        submitLabel="Guardar corrección"
        onSubmit={async (input) => {
          const result = await correctMatchAction(await user.getIdToken(), id, matchId, input);
          if (result.ok) router.push(`/organizaciones/${id}/partidos/${matchId}`);
          return result;
        }}
      />
    </main>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { updatePendingMatchAction } from "@/app/actions/matches";
import { useAuth } from "@/components/AuthProvider";
import { MatchForm } from "@/components/MatchForm";
import { useMatch } from "@/hooks/useMatch";
import { useOrganization } from "@/hooks/useOrganization";
import { usePlayers } from "@/hooks/usePlayers";

export default function EditMatchPage() {
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
    return <main><p>Solo el administrador/a puede editar partidos.</p></main>;
  }
  if (match.match.status !== "pending") {
    return <main><p>El partido ya está finalizado.</p></main>;
  }

  return (
    <main>
      <h1>Editar partido</h1>
      <MatchForm
        players={players.players}
        initial={match.match}
        submitLabel="Guardar cambios"
        onSubmit={async (input) => {
          const result = await updatePendingMatchAction(await user.getIdToken(), id, matchId, input);
          if (result.ok) router.push(`/organizaciones/${id}/partidos/${matchId}`);
          return result;
        }}
      />
    </main>
  );
}

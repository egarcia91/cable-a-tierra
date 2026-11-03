"use client";

import { useParams, useRouter } from "next/navigation";
import { createMatchAction } from "@/app/actions/matches";
import { useAuth } from "@/components/AuthProvider";
import { MatchForm } from "@/components/MatchForm";
import { useOrganization } from "@/hooks/useOrganization";
import { usePlayers } from "@/hooks/usePlayers";

export default function NewMatchPage() {
  const { id } = useParams<{ id: string }>();
  const organization = useOrganization(id);
  const players = usePlayers(id);
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading || organization.status === "loading" || players.status === "loading") {
    return <main><p>Cargando…</p></main>;
  }
  if (organization.status !== "ready" || players.status !== "ready") {
    return <main><p>No pudimos cargar la organización.</p></main>;
  }
  // Solo para no mostrar un formulario inútil: el permiso real lo valida el servidor.
  if (user?.uid !== organization.organization.adminUid) {
    return <main><p>Solo el administrador/a puede dar de alta partidos.</p></main>;
  }

  return (
    <main>
      <h1>Nuevo partido</h1>
      <p>{organization.organization.name}</p>
      <MatchForm
        players={players.players}
        submitLabel="Dar de alta el partido"
        onSubmit={async (input) => {
          const result = await createMatchAction(await user.getIdToken(), id, input);
          if (result.ok) router.push(`/organizaciones/${id}/partidos/${result.data.id}`);
          return result;
        }}
      />
    </main>
  );
}

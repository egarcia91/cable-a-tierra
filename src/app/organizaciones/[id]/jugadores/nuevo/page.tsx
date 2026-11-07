"use client";

import { useParams, useRouter } from "next/navigation";
import { createPlayerAction } from "@/app/actions/players";
import { useAuth } from "@/components/AuthProvider";
import { PlayerForm } from "@/components/PlayerForm";
import { useOrganization } from "@/hooks/useOrganization";
import { MAX_PLAYERS_PER_ORGANIZATION } from "@/lib/validation/player";

export default function NewPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const state = useOrganization(id);
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading || state.status === "loading") return <main><p>Cargando…</p></main>;
  if (state.status !== "ready") return <main><p>La organización no existe.</p></main>;

  const { organization } = state;

  // Solo para no mostrar un formulario inútil: el permiso real lo valida el servidor.
  if (user?.uid !== organization.adminUid) {
    return <main><p>Solo el administrador/a puede agregar jugadores/as.</p></main>;
  }
  if (organization.playerCount >= MAX_PLAYERS_PER_ORGANIZATION) {
    return (
      <main>
        <p>La organización ya tiene {MAX_PLAYERS_PER_ORGANIZATION} jugadores/as, que es el máximo.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Nuevo jugador/a</h1>
      <p>{organization.name}</p>
      <PlayerForm
        submitLabel="Agregar jugador/a"
        onSubmit={async (input) => {
          const result = await createPlayerAction(await user.getIdToken(), id, input);
          if (result.ok) router.push(`/organizaciones/${id}`);
          return result;
        }}
      />
    </main>
  );
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { linkPlayerAccountAction, updatePlayerAction } from "@/app/actions/players";
import { useAuth } from "@/components/AuthProvider";
import { LinkAccountForm } from "@/components/LinkAccountForm";
import { PlayerForm } from "@/components/PlayerForm";
import { usePlayerWithPrivate } from "@/hooks/usePlayer";

export default function EditPlayerPage() {
  const { id, playerId } = useParams<{ id: string; playerId: string }>();
  const { user, loading } = useAuth();

  if (loading) return <main><p>Cargando…</p></main>;
  // Los datos privados solo se pueden leer con sesión de un miembro.
  if (!user) return <main><p>Solo el administrador/a puede editar jugadores/as.</p></main>;

  return <EditPlayer organizationId={id} playerId={playerId} getIdToken={() => user.getIdToken()} />;
}

function EditPlayer({
  organizationId,
  playerId,
  getIdToken,
}: {
  organizationId: string;
  playerId: string;
  getIdToken: () => Promise<string>;
}) {
  const state = usePlayerWithPrivate(organizationId, playerId);
  const router = useRouter();

  if (state.status === "loading") return <main><p>Cargando…</p></main>;
  if (state.status === "not-found") return <main><p>El jugador/a no existe.</p></main>;
  // Un no miembro no puede leer los datos privados: las rules rechazan la lectura.
  if (state.status === "error") return <main><p>Solo el administrador/a puede editar jugadores/as.</p></main>;

  return (
    <main>
      <h1>Editar jugador/a</h1>
      <PlayerForm
        initial={state.player}
        submitLabel="Guardar cambios"
        onSubmit={async (input) => {
          const result = await updatePlayerAction(await getIdToken(), organizationId, playerId, input);
          if (result.ok) router.push(`/organizaciones/${organizationId}`);
          return result;
        }}
      />

      <h2>Cuenta asociada</h2>
      <LinkAccountForm
        linked={state.player.linkedUid !== null}
        onLink={async (email) => linkPlayerAccountAction(await getIdToken(), organizationId, playerId, { email })}
      />
    </main>
  );
}

"use client";

import Link from "next/link";
import { usePlayers } from "@/hooks/usePlayers";
import type { Organization } from "@/lib/types";
import { MAX_PLAYERS_PER_ORGANIZATION } from "@/lib/validation/player";

// Listado simple por apodo; el orden por estadísticas llega en el paso 9 (RF-14).
export function PlayersSection({ organization, isAdmin }: { organization: Organization; isAdmin: boolean }) {
  const state = usePlayers(organization.id);

  return (
    <section>
      <h2>Jugadores/as ({organization.playerCount})</h2>
      {isAdmin &&
        (organization.playerCount < MAX_PLAYERS_PER_ORGANIZATION ? (
          <p>
            <Link href={`/organizaciones/${organization.id}/jugadores/nuevo`}>Agregar jugador/a</Link>
          </p>
        ) : (
          <p>Ya hay {MAX_PLAYERS_PER_ORGANIZATION} jugadores/as, que es el máximo.</p>
        ))}

      {state.status === "loading" && <p>Cargando…</p>}
      {state.status === "error" && <p role="alert">No pudimos cargar los jugadores/as.</p>}
      {state.status === "ready" && state.players.length === 0 && <p>Todavía no hay jugadores/as.</p>}
      {state.status === "ready" && state.players.length > 0 && (
        <ul className="players">
          {state.players.map((player) => (
            <li key={player.id}>
              <span>{player.nickname}</span>
              {isAdmin && (
                <Link
                  href={`/organizaciones/${organization.id}/jugadores/${player.id}/editar`}
                  aria-label={`Editar a ${player.nickname}`}
                >
                  Editar
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

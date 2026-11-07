"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePlayers } from "@/hooks/usePlayers";
import { usePlayersPrivate } from "@/hooks/usePlayersPrivate";
import { formatDate } from "@/lib/format";
import {
  DEFAULT_PLAYER_SORT,
  PLAYER_SORT_OPTIONS,
  sortPlayers,
  type PlayerSortCriterion,
} from "@/lib/player-ranking";
import type { Organization } from "@/lib/types";
import { MAX_PLAYERS_PER_ORGANIZATION } from "@/lib/validation/player";

type Props = { organization: Organization; isAdmin: boolean; isMember: boolean };

// Hasta 40 jugadores/as: se traen todos y se ordenan en el cliente (RF-13, RF-14).
export function PlayersSection({ organization, isAdmin, isMember }: Props) {
  const state = usePlayers(organization.id);
  const privateById = usePlayersPrivate(organization.id, isMember);
  const [criterion, setCriterion] = useState<PlayerSortCriterion>(DEFAULT_PLAYER_SORT);

  const players = useMemo(
    () => (state.status === "ready" ? sortPlayers(state.players, criterion) : []),
    [state, criterion],
  );

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
      {state.status === "ready" && players.length === 0 && <p>Todavía no hay jugadores/as.</p>}

      {players.length > 0 && (
        <>
          <label className="sort">
            Ordenar por
            <select value={criterion} onChange={(e) => setCriterion(e.target.value as PlayerSortCriterion)}>
              {PLAYER_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <table className="players">
            <thead>
              <tr>
                <th scope="col">Jugador/a</th>
                {PLAYER_SORT_OPTIONS.map((option) => (
                  <th
                    key={option.value}
                    scope="col"
                    title={option.label}
                    className={option.value === criterion ? "active" : undefined}
                  >
                    {/* Partidos → PJ (partidos jugados); el resto, la inicial. */}
                    {option.value === "matches" ? "PJ" : option.label[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const personal = privateById.get(player.id);
                return (
                  <tr key={player.id}>
                    <th scope="row">
                      {player.nickname}
                      {player.linkedUid && <small> · con cuenta</small>}
                      {personal && (
                        <small className="personal">
                          {personal.name}
                          {personal.birthDate && ` · ${formatDate(personal.birthDate)}`}
                        </small>
                      )}
                      {isAdmin && (
                        <Link
                          href={`/organizaciones/${organization.id}/jugadores/${player.id}/editar`}
                          aria-label={`Editar a ${player.nickname}`}
                        >
                          Editar
                        </Link>
                      )}
                    </th>
                    {PLAYER_SORT_OPTIONS.map((option) => (
                      <td key={option.value} className={option.value === criterion ? "active" : undefined}>
                        {player[option.value]}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

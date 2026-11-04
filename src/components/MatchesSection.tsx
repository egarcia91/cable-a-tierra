"use client";

import Link from "next/link";
import { useMatchesList } from "@/hooks/useMatchesList";
import { formatDate } from "@/lib/format";
import type { Match } from "@/lib/types";

const statusLabel = (match: Match) =>
  match.status === "pending" ? "Pendiente" : `Finalizado ${match.scoreA} – ${match.scoreB}`;

/** Partidos de la organización de a 10, del más reciente al más antiguo (RF-12). Los ve cualquiera. */
export function MatchesSection({ organizationId, isAdmin }: { organizationId: string; isAdmin: boolean }) {
  const { items: matches, status, hasMore, loadMore } = useMatchesList(organizationId);

  return (
    <section>
      <h2>Partidos</h2>
      {isAdmin && (
        <p>
          <Link href={`/organizaciones/${organizationId}/partidos/nuevo`}>Dar de alta un partido</Link>
        </p>
      )}
      {status === "loading" && <p>Cargando…</p>}
      {status === "error" && <p role="alert">No pudimos cargar los partidos.</p>}
      {status === "ready" && matches.length === 0 && <p>Todavía no hay partidos.</p>}

      <ol className="matches">
        {matches.map((match) => (
          <li key={match.id}>
            <Link href={`/organizaciones/${organizationId}/partidos/${match.id}`}>
              {formatDate(match.date)} · {match.place}
            </Link>
            <span>{statusLabel(match)}</span>
          </li>
        ))}
      </ol>

      {hasMore && (
        <button type="button" onClick={loadMore} disabled={status === "loading-more"}>
          {status === "loading-more" ? "Cargando…" : "Ver 10 más"}
        </button>
      )}
    </section>
  );
}

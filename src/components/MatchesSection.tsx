"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { formatDate } from "@/lib/format";
import type { Match } from "@/lib/types";

// Los 10 más recientes. La paginación y el detalle del listado llegan en el paso 12.
export function MatchesSection({ organizationId, isAdmin }: { organizationId: string; isAdmin: boolean }) {
  const [matches, setMatches] = useState<Match[] | null>(null);

  useEffect(
    () =>
      onSnapshot(
        query(
          collection(db, "organizations", organizationId, "matches"),
          orderBy("date", "desc"),
          orderBy("createdAt", "desc"),
          limit(10),
        ),
        (snap) => setMatches(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Match, "id">) }))),
        () => setMatches([]),
      ),
    [organizationId],
  );

  return (
    <section>
      <h2>Partidos</h2>
      {isAdmin && (
        <p>
          <Link href={`/organizaciones/${organizationId}/partidos/nuevo`}>Dar de alta un partido</Link>
        </p>
      )}
      {matches === null && <p>Cargando…</p>}
      {matches?.length === 0 && <p>Todavía no hay partidos.</p>}
      {matches && matches.length > 0 && (
        <ul className="matches">
          {matches.map((match) => (
            <li key={match.id}>
              <Link href={`/organizaciones/${organizationId}/partidos/${match.id}`}>
                {formatDate(match.date)} · {match.place}
              </Link>
              <span>{match.status === "pending" ? "Pendiente" : "Finalizado"}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

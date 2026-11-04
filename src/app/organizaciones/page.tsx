"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useOrganizationsList } from "@/hooks/useOrganizationsList";

function finishedMatchesLabel(count: number): string {
  return count === 1 ? "1 partido finalizado" : `${count} partidos finalizados`;
}

export default function OrganizationsPage() {
  const { user } = useAuth();
  const { items: organizations, status, hasMore, loadMore } = useOrganizationsList();

  return (
    <main>
      <h1>Organizaciones</h1>
      {user && (
        <p>
          <Link href="/organizaciones/nueva">Crear organización</Link>
        </p>
      )}

      {status === "loading" && <p>Cargando…</p>}
      {status === "error" && <p role="alert">No pudimos cargar las organizaciones.</p>}
      {status === "ready" && organizations.length === 0 && <p>Todavía no hay organizaciones.</p>}

      <ol className="organizations">
        {organizations.map((organization) => (
          <li key={organization.id}>
            <Link href={`/organizaciones/${organization.id}`}>{organization.name}</Link>
            <span>{finishedMatchesLabel(organization.finishedMatchCount)}</span>
          </li>
        ))}
      </ol>

      {hasMore && (
        <button type="button" onClick={loadMore} disabled={status === "loading-more"}>
          {status === "loading-more" ? "Cargando…" : "Ver 10 más"}
        </button>
      )}
    </main>
  );
}

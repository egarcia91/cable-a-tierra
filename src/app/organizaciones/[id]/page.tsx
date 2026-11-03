"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { MatchesSection } from "@/components/MatchesSection";
import { PlayersSection } from "@/components/PlayersSection";
import { useOrganization } from "@/hooks/useOrganization";

export default function OrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const state = useOrganization(id);
  const { user } = useAuth();

  if (state.status === "loading") return <main><p>Cargando…</p></main>;
  if (state.status === "not-found") return <main><p>La organización no existe.</p></main>;
  if (state.status === "error") return <main><p role="alert">No pudimos cargar la organización.</p></main>;

  const { organization } = state;
  const isAdmin = user?.uid === organization.adminUid;
  // Miembros: el admin y las cuentas asociadas a un jugador/a (RF-04c). Es solo para
  // decidir qué pedir: quién puede leer los datos privados lo deciden las rules.
  const isMember = user !== null && organization.memberUids.includes(user.uid);

  // No hay opción de eliminar la organización (RF-17, AC-20a).
  return (
    <main>
      <h1>{organization.name}</h1>
      {organization.description && <p>{organization.description}</p>}
      {isAdmin && (
        <p>
          <Link href={`/organizaciones/${organization.id}/editar`}>Editar organización</Link>
        </p>
      )}
      <PlayersSection organization={organization} isAdmin={isAdmin} isMember={isMember} />
      <MatchesSection organizationId={organization.id} isAdmin={isAdmin} />
    </main>
  );
}

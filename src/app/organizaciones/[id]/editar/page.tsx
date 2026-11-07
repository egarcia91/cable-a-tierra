"use client";

import { useParams, useRouter } from "next/navigation";
import { updateOrganizationAction } from "@/app/actions/organizations";
import { useAuth } from "@/components/AuthProvider";
import { OrganizationForm } from "@/components/OrganizationForm";
import { useOrganization } from "@/hooks/useOrganization";

export default function EditOrganizationPage() {
  const { id } = useParams<{ id: string }>();
  const state = useOrganization(id);
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading || state.status === "loading") return <main><p>Cargando…</p></main>;
  if (state.status === "not-found") return <main><p>La organización no existe.</p></main>;
  if (state.status === "error") return <main><p role="alert">No pudimos cargar la organización.</p></main>;

  const { organization } = state;

  // Solo para no mostrar un formulario inútil: el permiso real lo valida el servidor.
  if (user?.uid !== organization.adminUid) {
    return (
      <main>
        <p>Solo el administrador/a puede editar esta organización.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Editar organización</h1>
      <OrganizationForm
        initial={organization}
        submitLabel="Guardar cambios"
        onSubmit={async (input) => {
          const result = await updateOrganizationAction(await user.getIdToken(), id, input);
          if (result.ok) router.push(`/organizaciones/${id}`);
          return result;
        }}
      />
    </main>
  );
}

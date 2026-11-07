"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createOrganizationAction } from "@/app/actions/organizations";
import { useAuth } from "@/components/AuthProvider";
import { OrganizationForm } from "@/components/OrganizationForm";

export default function NewOrganizationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) return <main><p>Cargando…</p></main>;

  if (!user) {
    return (
      <main>
        <h1>Nueva organización</h1>
        <p>
          Para crear una organización tenés que <Link href="/">iniciar sesión</Link>.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Nueva organización</h1>
      <OrganizationForm
        submitLabel="Crear organización"
        onSubmit={async (input) => {
          const result = await createOrganizationAction(await user.getIdToken(), input);
          if (result.ok) router.push(`/organizaciones/${result.data.id}`);
          return result;
        }}
      />
    </main>
  );
}

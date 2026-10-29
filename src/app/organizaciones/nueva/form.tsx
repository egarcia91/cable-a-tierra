"use client";

import { useActionState } from "react";
import { createOrganizationAction } from "@/app/actions/organizations";
import { MAX_ORG_DESCRIPTION_LENGTH, MAX_ORG_NAME_LENGTH } from "@/lib/domain/validation";

export function NewOrganizationForm() {
  const [state, action, pending] = useActionState(createOrganizationAction, {});

  return (
    <form action={action}>
      <label>
        Nombre
        <input name="name" required maxLength={MAX_ORG_NAME_LENGTH} />
      </label>
      <label>
        Descripción
        <textarea name="description" maxLength={MAX_ORG_DESCRIPTION_LENGTH} />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear organización"}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}

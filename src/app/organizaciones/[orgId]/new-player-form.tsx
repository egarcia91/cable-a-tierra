"use client";

import { useActionState, useEffect, useRef } from "react";
import { createPlayerAction } from "@/app/actions/players";
import { MAX_TEXT_LENGTH, MIN_BIRTH_DATE } from "@/lib/domain/validation";

export function NewPlayerForm({ orgId }: { orgId: string }) {
  const [state, action, pending] = useActionState(createPlayerAction.bind(null, orgId), {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.savedAt) formRef.current?.reset();
  }, [state.savedAt]);

  return (
    <form ref={formRef} action={action}>
      <h3>Nuevo jugador/a</h3>
      <label>
        Nombre completo
        <input name="fullName" required maxLength={MAX_TEXT_LENGTH} />
      </label>
      <label>
        Apodo
        <input name="nickname" required maxLength={MAX_TEXT_LENGTH} />
      </label>
      <label>
        Fecha de nacimiento
        <input name="birthDate" type="date" required min={MIN_BIRTH_DATE} />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Agregar jugador/a"}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}

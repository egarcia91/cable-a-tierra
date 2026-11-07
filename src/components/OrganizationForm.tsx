"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import {
  ORGANIZATION_DESCRIPTION_MAX,
  ORGANIZATION_NAME_MAX,
  type OrganizationInput,
} from "@/lib/validation/organization";

type Props = {
  initial?: { name: string; description: string | null };
  submitLabel: string;
  onSubmit: (input: OrganizationInput) => Promise<ActionResult<unknown>>;
};

// La validación la hace el servidor; los maxLength solo ayudan mientras se escribe.
export function OrganizationForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await onSubmit({ name, description });
    setPending(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>
        Nombre
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={ORGANIZATION_NAME_MAX} required />
      </label>
      <label>
        Descripción (opcional)
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={ORGANIZATION_DESCRIPTION_MAX}
          rows={3}
        />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Guardando…" : submitLabel}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";

type Props = {
  linked: boolean;
  onLink: (email: string) => Promise<ActionResult>;
};

// No hay opción de desasociar: queda fuera del alcance del MVP.
export function LinkAccountForm({ linked: initiallyLinked, onLink }: Props) {
  const [email, setEmail] = useState("");
  const [linked, setLinked] = useState(initiallyLinked);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (linked) return <p>Este jugador/a ya tiene una cuenta asociada.</p>;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await onLink(email);
    setPending(false);
    if (result.ok) setLinked(true);
    else setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <p>
        Si el jugador/a ya entró a la app con Google, asociá su cuenta para que vea los datos de la organización.
      </p>
      <label>
        Email de Google
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Asociando…" : "Asociar cuenta"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

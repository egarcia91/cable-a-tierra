"use client";

import { useState } from "react";
import type { ActionResult } from "@/lib/action-result";
import { todayInArgentina } from "@/lib/dates";
import { MIN_BIRTH_DATE, PLAYER_NAME_MAX, PLAYER_NICKNAME_MAX, type PlayerInput } from "@/lib/validation/player";

type Props = {
  initial?: { name: string; nickname: string; birthDate: string | null };
  submitLabel: string;
  onSubmit: (input: PlayerInput) => Promise<ActionResult<unknown>>;
};

// La validación la hace el servidor; los límites del form solo ayudan mientras se escribe.
export function PlayerForm({ initial, submitLabel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [nickname, setNickname] = useState(initial?.nickname ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await onSubmit({ name, nickname, birthDate });
    setPending(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className="form">
      <label>
        Nombre completo
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={PLAYER_NAME_MAX} required />
      </label>
      <label>
        Apodo
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={PLAYER_NICKNAME_MAX} required />
      </label>
      <label>
        Fecha de nacimiento (opcional)
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          min={MIN_BIRTH_DATE}
          max={todayInArgentina()}
        />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Guardando…" : submitLabel}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

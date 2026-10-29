"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/current-user";
import { DomainError } from "@/lib/domain/errors";
import { createPlayer } from "@/lib/players";

export interface PlayerFormState {
  error?: string;
  savedAt?: number; // cambia en cada alta exitosa, para que el form se limpie
}

export async function createPlayerAction(
  orgId: string,
  _prev: PlayerFormState,
  formData: FormData,
): Promise<PlayerFormState> {
  try {
    const user = await requireUser();
    await createPlayer(user.uid, orgId, {
      fullName: String(formData.get("fullName") ?? ""),
      nickname: String(formData.get("nickname") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
    });
  } catch (err) {
    return { error: err instanceof DomainError ? err.message : "No se pudo crear el jugador/a." };
  }
  revalidatePath(`/organizaciones/${orgId}`);
  return { savedAt: Date.now() };
}

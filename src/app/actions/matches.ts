"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { DomainError } from "@/lib/domain/errors";
import { parseLineup } from "@/lib/domain/validation";
import { createMatch, finishMatch } from "@/lib/matches";

export interface MatchFormState {
  error?: string;
}

export async function createMatchAction(
  orgId: string,
  _prev: MatchFormState,
  formData: FormData,
): Promise<MatchFormState> {
  try {
    const user = await requireUser();
    await createMatch(user.uid, orgId, {
      date: String(formData.get("date") ?? ""),
      place: String(formData.get("place") ?? ""),
      ...parseLineup(String(formData.get("lineup") ?? "")),
    });
  } catch (err) {
    return { error: err instanceof DomainError ? err.message : "No se pudo dar de alta el partido." };
  }
  redirect(`/organizaciones/${orgId}`);
}

// Lee goalsA-0, goalsA-1, … hasta el primero que falte. Un campo vacío cuenta como 0.
function readGoals(formData: FormData, prefix: string): number[] {
  const goals: number[] = [];
  for (let i = 0; formData.has(`${prefix}-${i}`); i++) goals.push(Number(formData.get(`${prefix}-${i}`)));
  return goals;
}

export async function finishMatchAction(
  orgId: string,
  matchId: string,
  _prev: MatchFormState,
  formData: FormData,
): Promise<MatchFormState> {
  try {
    const user = await requireUser();
    await finishMatch(user.uid, orgId, matchId, {
      goalsA: readGoals(formData, "goalsA"),
      goalsB: readGoals(formData, "goalsB"),
      ownGoalsA: Number(formData.get("ownGoalsA")),
      ownGoalsB: Number(formData.get("ownGoalsB")),
    });
  } catch (err) {
    return { error: err instanceof DomainError ? err.message : "No se pudo finalizar el partido." };
  }
  redirect(`/organizaciones/${orgId}`);
}

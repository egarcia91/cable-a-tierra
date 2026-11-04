"use server";

import type { ActionResult } from "@/lib/action-result";
import {
  finishMatchInputSchema,
  matchInputSchema,
  type FinishMatchInput,
  type MatchInput,
} from "@/lib/validation/match";
import { requireUser } from "@/server/auth";
import { createMatch, finishMatch, updatePendingMatch } from "@/server/matches";
import { runAction } from "@/server/run-action";
import { validate } from "@/server/validate";

export async function createMatchAction(
  idToken: string | undefined,
  organizationId: string,
  input: MatchInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction("createMatch", async () => {
    const user = await requireUser(idToken);
    const id = await createMatch(user, organizationId, validate(matchInputSchema, input));
    return { id };
  });
}

export async function updatePendingMatchAction(
  idToken: string | undefined,
  organizationId: string,
  matchId: string,
  input: MatchInput,
): Promise<ActionResult> {
  return runAction("updatePendingMatch", async () => {
    const user = await requireUser(idToken);
    await updatePendingMatch(user, organizationId, matchId, validate(matchInputSchema, input));
  });
}

export async function finishMatchAction(
  idToken: string | undefined,
  organizationId: string,
  matchId: string,
  input: FinishMatchInput,
): Promise<ActionResult> {
  return runAction("finishMatch", async () => {
    const user = await requireUser(idToken);
    await finishMatch(user, organizationId, matchId, validate(finishMatchInputSchema, input));
  });
}

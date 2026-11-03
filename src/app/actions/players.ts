"use server";

import type { ActionResult } from "@/lib/action-result";
import { playerInputSchema, type PlayerInput } from "@/lib/validation/player";
import { requireUser } from "@/server/auth";
import { createPlayer, updatePlayer } from "@/server/players";
import { runAction } from "@/server/run-action";
import { validate } from "@/server/validate";

export async function createPlayerAction(
  idToken: string | undefined,
  organizationId: string,
  input: PlayerInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction("createPlayer", async () => {
    const user = await requireUser(idToken);
    const id = await createPlayer(user, organizationId, validate(playerInputSchema, input));
    return { id };
  });
}

export async function updatePlayerAction(
  idToken: string | undefined,
  organizationId: string,
  playerId: string,
  input: PlayerInput,
): Promise<ActionResult> {
  return runAction("updatePlayer", async () => {
    const user = await requireUser(idToken);
    await updatePlayer(user, organizationId, playerId, validate(playerInputSchema, input));
  });
}

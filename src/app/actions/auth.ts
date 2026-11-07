"use server";

import type { ActionResult } from "@/lib/action-result";
import { requireUser } from "@/server/auth";
import { runAction } from "@/server/run-action";
import { ensureUserRegistered } from "@/server/users";

export async function registerUser(idToken: string): Promise<ActionResult> {
  return runAction("registerUser", async () => {
    const user = await requireUser(idToken);
    await ensureUserRegistered(user);
  });
}

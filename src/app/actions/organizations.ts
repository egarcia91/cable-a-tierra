"use server";

import type { ActionResult } from "@/lib/action-result";
import { organizationInputSchema, type OrganizationInput } from "@/lib/validation/organization";
import { requireUser } from "@/server/auth";
import { createOrganization, updateOrganization } from "@/server/organizations";
import { runAction } from "@/server/run-action";
import { validate } from "@/server/validate";

export async function createOrganizationAction(
  idToken: string | undefined,
  input: OrganizationInput,
): Promise<ActionResult<{ id: string }>> {
  return runAction("createOrganization", async () => {
    const user = await requireUser(idToken);
    const id = await createOrganization(user, validate(organizationInputSchema, input));
    return { id };
  });
}

export async function updateOrganizationAction(
  idToken: string | undefined,
  organizationId: string,
  input: OrganizationInput,
): Promise<ActionResult> {
  return runAction("updateOrganization", async () => {
    const user = await requireUser(idToken);
    await updateOrganization(user, organizationId, validate(organizationInputSchema, input));
  });
}

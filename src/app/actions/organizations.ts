"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/current-user";
import { DomainError } from "@/lib/domain/errors";
import { createOrganization } from "@/lib/organizations";

export interface FormState {
  error?: string;
}

export async function createOrganizationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  let orgId: string;
  try {
    const user = await requireUser();
    orgId = await createOrganization(user.uid, {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
    });
  } catch (err) {
    return { error: err instanceof DomainError ? err.message : "No se pudo crear la organización." };
  }
  // redirect() funciona tirando una excepción: va fuera del try.
  redirect(`/organizaciones/${orgId}`);
}

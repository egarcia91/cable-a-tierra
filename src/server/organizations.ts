import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { sortKey } from "@/lib/sort-key";
import type { ValidOrganization } from "@/lib/validation/organization";
import { UserError } from "./errors";

const organizations = adminDb.collection("organizations");

/**
 * Crea la organización con quien la crea como su único administrador/a
 * (RF-02a, RF-02b, RF-06a). Los contadores arrancan en 0 y solo los toca el servidor.
 */
export async function createOrganization(user: DecodedIdToken, input: ValidOrganization): Promise<string> {
  const ref = organizations.doc();
  await ref.create({
    name: input.name,
    nameSort: sortKey(input.name),
    description: input.description,
    adminUid: user.uid,
    memberUids: [user.uid],
    playerCount: 0,
    finishedMatchCount: 0,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

/** Edita nombre y descripción; solo lo puede hacer su administrador/a (RF-06e, RF-06f). */
export async function updateOrganization(
  user: DecodedIdToken,
  organizationId: string,
  input: ValidOrganization,
): Promise<void> {
  const ref = organizations.doc(organizationId);
  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new UserError("La organización no existe.");
    if (snap.get("adminUid") !== user.uid) {
      throw new UserError("Solo el administrador/a puede editar esta organización.");
    }
    tx.update(ref, {
      name: input.name,
      nameSort: sortKey(input.name),
      description: input.description,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

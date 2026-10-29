import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";
import { validateOrganization, type OrganizationInput } from "@/lib/domain/validation";

export interface Organization {
  id: string;
  name: string;
  description: string;
  adminUid: string;
  playerCount: number;
  finishedMatchCount: number;
}

// RF-02, RF-06a: quien la crea queda como único admin.
export async function createOrganization(adminUid: string, input: OrganizationInput): Promise<string> {
  const { name, description } = validateOrganization(input);
  const ref = adminDb.collection("organizations").doc();
  await ref.create({
    name,
    description,
    adminUid,
    // Contadores para el tope de 40 jugadores/as (RF-07e) y el orden del listado (RF-16).
    playerCount: 0,
    finishedMatchCount: 0,
    createdAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
  const snap = await adminDb.doc(`organizations/${orgId}`).get();
  if (!snap.exists) return null;
  const d = snap.data()!;
  return {
    id: snap.id,
    name: d.name,
    description: d.description,
    adminUid: d.adminUid,
    playerCount: d.playerCount,
    finishedMatchCount: d.finishedMatchCount,
  };
}

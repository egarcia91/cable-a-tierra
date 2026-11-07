import "server-only";
import type { DecodedIdToken } from "firebase-admin/auth";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase/admin";

// Código gRPC de Firestore cuando create() encuentra el documento ya existente.
const ALREADY_EXISTS = 6;

/**
 * Registra al usuario la primera vez que inicia sesión (RF-01b).
 * Las siguientes veces no hace nada. El email se guarda en minúsculas para
 * poder asociar la cuenta a un jugador/a por email (RF-07b).
 */
export async function ensureUserRegistered(user: DecodedIdToken): Promise<{ created: boolean }> {
  try {
    await adminDb.doc(`users/${user.uid}`).create({
      email: user.email!.toLowerCase(),
      displayName: user.name ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { created: true };
  } catch (error) {
    if ((error as { code?: number }).code === ALREADY_EXISTS) return { created: false };
    throw error;
  }
}
